import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import InstructorProfile from "../models/InstructorProfile.js";
import { GALLERY_LIMIT, addToGallery, checkPhotoEdits, removeFromGallery } from "../utils/gallery.js";
import { publicIdFromUrl, sniffImageType } from "../utils/photos.js";

const bytes = (...values) => Buffer.concat([Buffer.from(values), Buffer.alloc(16)]);

describe("sniffImageType", () => {
  it("reads JPEG, PNG and WebP from their signatures", () => {
    assert.equal(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
    assert.equal(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
    assert.equal(sniffImageType(Buffer.concat([Buffer.from("RIFF\0\0\0\0WEBPVP8 "), Buffer.alloc(8)])), "image/webp");
  });

  it("rejects everything else, whatever the file claims to be", () => {
    assert.equal(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
    assert.equal(sniffImageType(Buffer.from("GIF89a" + "\0".repeat(16))), null);
    assert.equal(sniffImageType(Buffer.from("RIFF\0\0\0\0WAVEfmt " + "\0".repeat(8))), null);
    assert.equal(sniffImageType(bytes(0xff, 0xd8).subarray(0, 4)), null);
    assert.equal(sniffImageType("not a buffer"), null);
  });
});

describe("publicIdFromUrl", () => {
  before(() => {
    process.env.CLOUDINARY_URL = "cloudinary://key:secret@ourcloud";
  });

  it("finds the public id in our upload URLs", () => {
    assert.equal(
      publicIdFromUrl("https://res.cloudinary.com/ourcloud/image/upload/v1729700000/pro-me/gallery/abc/x1y2.jpg"),
      "pro-me/gallery/abc/x1y2"
    );
    assert.equal(publicIdFromUrl("https://res.cloudinary.com/ourcloud/image/upload/pro-me/a.webp"), "pro-me/a");
  });

  it("refuses URLs from another account or another host", () => {
    assert.equal(publicIdFromUrl("https://res.cloudinary.com/othercloud/image/upload/v1/pro-me/gallery/abc/x.jpg"), null);
    assert.equal(publicIdFromUrl("https://example.com/image/upload/v1/pro-me/gallery/abc/x.jpg"), null);
    assert.equal(publicIdFromUrl("http://res.cloudinary.com/ourcloud/image/upload/v1/x.jpg"), null);
    assert.equal(publicIdFromUrl(undefined), null);
  });
});

describe("checkPhotoEdits", () => {
  const ours = ["https://res.cloudinary.com/ourcloud/image/upload/v1/a.jpg", "https://res.cloudinary.com/ourcloud/image/upload/v1/b.jpg"];

  it("allows reordering and choosing one of the photos", () => {
    assert.equal(checkPhotoEdits({ gallery: [ours[1], ours[0]], profilePhotoUrl: ours[1] }, ours), null);
    assert.equal(checkPhotoEdits({ profilePhotoUrl: "" }, ours), null);
    assert.equal(checkPhotoEdits({}, ours), null);
  });

  it("refuses a URL that was not uploaded", () => {
    assert.match(checkPhotoEdits({ gallery: [ours[0], "https://example.com/x.jpg"] }, ours), /only reorder/);
    assert.match(checkPhotoEdits({ profilePhotoUrl: "https://example.com/me.jpg" }, ours), /one of your gallery photos/);
  });

  it("leaves adding and removing to the gallery endpoints", () => {
    assert.match(checkPhotoEdits({ gallery: [ours[0]] }, ours), /only reorder/);
    assert.match(checkPhotoEdits({ gallery: [ours[0], ours[0]] }, ours), /only reorder/);
    assert.match(checkPhotoEdits({ gallery: "a.jpg" }, ours), /only reorder/);
    assert.match(checkPhotoEdits({ gallery: [ours[0]] }, []), /only reorder/);
  });
});

describe("gallery", () => {
  let memoryServer;
  let userId;

  before(async () => {
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri("prome-photos-test"));
    await InstructorProfile.syncIndexes();
  });

  beforeEach(async () => {
    await InstructorProfile.deleteMany({});
    userId = new mongoose.Types.ObjectId();
    await InstructorProfile.create({
      userId,
      adiNumber: "ADI-00003",
      counties: ["dublin"],
      testCentres: ["finglas"],
      licenceCategories: ["B"],
      transmission: ["manual"],
    });
  });

  after(async () => {
    await mongoose.disconnect();
    await memoryServer.stop();
  });

  const photo = (n) => `https://res.cloudinary.com/ourcloud/image/upload/v1/pro-me/gallery/x/${n}.jpg`;

  it("adds photos up to the limit and no further", async () => {
    for (let n = 0; n < GALLERY_LIMIT; n++) {
      assert.equal((await addToGallery(userId, photo(n))).length, n + 1);
    }
    assert.equal(await addToGallery(userId, photo("extra")), null);
  });

  it("lets only one of two uploads racing for the last place in", async () => {
    for (let n = 0; n < GALLERY_LIMIT - 1; n++) await addToGallery(userId, photo(n));

    const results = await Promise.all([addToGallery(userId, photo("a")), addToGallery(userId, photo("b"))]);
    assert.equal(results.filter(Boolean).length, 1);
    const stored = await InstructorProfile.findOne({ userId }).lean();
    assert.equal(stored.gallery.length, GALLERY_LIMIT);
  });

  it("has nowhere to add to without a profile", async () => {
    assert.equal(await addToGallery(new mongoose.Types.ObjectId(), photo(0)), null);
  });

  it("clears the profile photo when it is the photo removed", async () => {
    await addToGallery(userId, photo(0));
    await addToGallery(userId, photo(1));
    await InstructorProfile.updateOne({ userId }, { $set: { profilePhotoUrl: photo(0) } });

    await removeFromGallery(userId, photo(1));
    assert.equal((await InstructorProfile.findOne({ userId }).lean()).profilePhotoUrl, photo(0));
    await removeFromGallery(userId, photo(0));
    assert.equal((await InstructorProfile.findOne({ userId }).lean()).profilePhotoUrl, "");
  });

  it("removes only a photo that is in the gallery", async () => {
    await addToGallery(userId, photo(0));
    await addToGallery(userId, photo(1));
    assert.deepEqual(await removeFromGallery(userId, photo(0)), [photo(1)]);
    assert.equal(await removeFromGallery(userId, photo(0)), null);
    assert.equal(await removeFromGallery(new mongoose.Types.ObjectId(), photo(1)), null);
  });
});
