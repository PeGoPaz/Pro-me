/*
 * Avatars as they are served. Nothing writes base64 avatars any more, so these
 * guard the read side for the accounts that still have one.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { decodeAvatar, publicAvatarUrl, withPublicAvatar } from "../utils/avatar.js";

const PNG_DATA_URL = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64")}`;
const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/v1/pro-me/avatars/abc/avatar.jpg";

describe("decodeAvatar", () => {
  it("decodes a stored image", () => {
    const image = decodeAvatar(PNG_DATA_URL);
    assert.equal(image.type, "image/png");
    assert.deepEqual([...image.buffer], [0x89, 0x50, 0x4e, 0x47]);
  });

  it("serves image/jpg as image/jpeg", () => {
    assert.equal(decodeAvatar("data:image/jpg;base64,AAAA").type, "image/jpeg");
  });

  it("never serves something a browser would run", () => {
    assert.equal(decodeAvatar("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="), null);
    assert.equal(decodeAvatar("data:text/html;base64,PGgxPg=="), null);
    assert.equal(decodeAvatar(CLOUDINARY), null);
    assert.equal(decodeAvatar(undefined), null);
  });
});

describe("publicAvatarUrl", () => {
  it("passes a Cloudinary URL through", () => {
    assert.equal(publicAvatarUrl({ _id: "abc", avatarUrl: CLOUDINARY }), CLOUDINARY);
  });

  it("turns a stored data URL into a versioned link", () => {
    const updatedAt = new Date("2026-10-01T12:00:00Z");
    assert.equal(
      publicAvatarUrl({ _id: "abc", updatedAt, avatarUrl: PNG_DATA_URL }),
      `/api/users/abc/avatar?v=${updatedAt.getTime()}`
    );
  });

  it("gives nothing for no avatar or an unknown value", () => {
    assert.equal(publicAvatarUrl({ _id: "abc", avatarUrl: "" }), "");
    assert.equal(publicAvatarUrl({ _id: "abc", avatarUrl: "http://insecure.example/a.jpg" }), "");
    assert.equal(publicAvatarUrl(null), "");
  });
});

describe("withPublicAvatar", () => {
  it("swaps the avatar for its link and drops updatedAt", () => {
    const user = { _id: "abc", name: "Aoife", updatedAt: new Date(0), avatarUrl: PNG_DATA_URL };
    assert.deepEqual(withPublicAvatar(user), { _id: "abc", name: "Aoife", avatarUrl: "/api/users/abc/avatar?v=0" });
    assert.equal(user.avatarUrl, PNG_DATA_URL, "the original is left alone");
  });
});
