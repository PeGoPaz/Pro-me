import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import InstructorProfile from "../models/InstructorProfile.js";
import { CAPTION_MAX, POST_LIMIT, addPost, checkPhotoEdits, editCaption, galleryToPosts, newestFirst, removePost } from "../utils/posts.js";
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
  const ours = [
    { url: "https://res.cloudinary.com/ourcloud/image/upload/v1/a.jpg" },
    { url: "https://res.cloudinary.com/ourcloud/image/upload/v1/b.jpg" },
  ];

  it("allows choosing the photo of one of your posts, or none", () => {
    assert.equal(checkPhotoEdits({ profilePhotoUrl: ours[1].url }, ours), null);
    assert.equal(checkPhotoEdits({ profilePhotoUrl: "" }, ours), null);
    assert.equal(checkPhotoEdits({}, ours), null);
  });

  it("refuses a URL that was not posted", () => {
    assert.match(checkPhotoEdits({ profilePhotoUrl: "https://example.com/me.jpg" }, ours), /one of your posts/);
    assert.match(checkPhotoEdits({ profilePhotoUrl: ours[0].url }, []), /one of your posts/);
  });

  it("leaves posting and removing to the posts endpoints", () => {
    assert.match(checkPhotoEdits({ posts: [] }, ours), /POST, captioned with PATCH/);
    assert.match(checkPhotoEdits({ gallery: [ours[0].url] }, ours), /POST, captioned with PATCH/);
  });
});

describe("newestFirst and galleryToPosts", () => {
  it("orders posts by when they went up, newest first, without changing the list it was given", () => {
    const posts = [
      { url: "a", postedAt: new Date("2026-11-01") },
      { url: "c", postedAt: new Date("2026-11-03") },
      { url: "b", postedAt: new Date("2026-11-02") },
    ];
    assert.deepEqual(newestFirst(posts).map((post) => post.url), ["c", "b", "a"]);
    assert.deepEqual(posts.map((post) => post.url), ["a", "c", "b"]);
    assert.deepEqual(newestFirst(undefined), []);
  });

  it("turns an old gallery into posts that keep its order and have no captions", () => {
    const when = new Date("2026-10-24T15:00:00Z");
    const posts = galleryToPosts(["first.jpg", "second.jpg", "", 42], when);
    assert.deepEqual(posts.map((post) => [post.url, post.caption]), [["first.jpg", ""], ["second.jpg", ""]]);
    assert.deepEqual(newestFirst(posts).map((post) => post.url), ["first.jpg", "second.jpg"]);
    assert.equal(posts[0].postedAt.getTime(), when.getTime());
    assert.deepEqual(galleryToPosts(undefined), []);
  });
});

describe("posts", () => {
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
  const stored = async () => (await InstructorProfile.findOne({ userId }).lean()).posts;

  it("posts a photo with its caption, trimmed, and the time it went up", async () => {
    const when = new Date("2026-11-20T10:00:00Z");
    const post = await addPost(userId, { url: photo(0), caption: "  The Yaris  " }, when);
    assert.equal(post.url, photo(0));
    assert.equal(post.caption, "The Yaris");
    assert.equal(post.postedAt.getTime(), when.getTime());
    assert.ok(post._id);
  });

  it("cuts a caption that is too long rather than refusing the photo", async () => {
    const post = await addPost(userId, { url: photo(0), caption: "x".repeat(CAPTION_MAX + 50) });
    assert.equal(post.caption.length, CAPTION_MAX);
  });

  it("adds posts up to the limit and no further", async () => {
    for (let n = 0; n < POST_LIMIT; n++) assert.ok(await addPost(userId, { url: photo(n) }));
    assert.equal(await addPost(userId, { url: photo("extra") }), null);
    assert.equal((await stored()).length, POST_LIMIT);
  });

  it("lets only one of two uploads racing for the last place in", async () => {
    for (let n = 0; n < POST_LIMIT - 1; n++) await addPost(userId, { url: photo(n) });
    const results = await Promise.all([addPost(userId, { url: photo("a") }), addPost(userId, { url: photo("b") })]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await stored()).length, POST_LIMIT);
  });

  it("has nowhere to post without a profile", async () => {
    assert.equal(await addPost(new mongoose.Types.ObjectId(), { url: photo(0) }), null);
  });

  it("changes the caption of your own post only", async () => {
    const post = await addPost(userId, { url: photo(0), caption: "Old" });
    assert.equal((await editCaption(userId, post._id, " New ")).caption, "New");
    assert.equal((await stored())[0].caption, "New");
    assert.equal(await editCaption(new mongoose.Types.ObjectId(), post._id, "Hijacked"), null);
    assert.equal(await editCaption(userId, new mongoose.Types.ObjectId(), "Nothing"), null);
    assert.equal((await stored())[0].caption, "New");
  });

  it("removes only a post that is yours, and returns what it removed", async () => {
    const first = await addPost(userId, { url: photo(0) });
    const second = await addPost(userId, { url: photo(1) });
    assert.equal((await removePost(userId, first._id)).url, photo(0));
    assert.equal(await removePost(userId, first._id), null);
    assert.equal(await removePost(new mongoose.Types.ObjectId(), second._id), null);
    assert.deepEqual((await stored()).map((post) => post.url), [photo(1)]);
  });

  it("clears the profile photo when it is the photo removed", async () => {
    const first = await addPost(userId, { url: photo(0) });
    const second = await addPost(userId, { url: photo(1) });
    await InstructorProfile.updateOne({ userId }, { $set: { profilePhotoUrl: photo(0) } });

    await removePost(userId, second._id);
    assert.equal((await InstructorProfile.findOne({ userId }).lean()).profilePhotoUrl, photo(0));
    await removePost(userId, first._id);
    assert.equal((await InstructorProfile.findOne({ userId }).lean()).profilePhotoUrl, "");
  });
});
