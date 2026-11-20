import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import InstructorProfile from "../models/InstructorProfile.js";
import User from "../models/User.js";
import { makeCursor, parseCursor, readFeed, readStories } from "../utils/feed.js";

const hours = (n) => n * 60 * 60 * 1000;
const NOW = new Date("2026-11-20T12:00:00.000Z");
const at = (hoursAgo) => new Date(NOW.getTime() - hours(hoursAgo));

describe("feed cursor", () => {
  it("round-trips the time and id of the last post shown", () => {
    const post = { _id: new mongoose.Types.ObjectId(), postedAt: at(2) };
    const cursor = parseCursor(makeCursor(post));
    assert.equal(cursor.postedAt.getTime(), post.postedAt.getTime());
    assert.equal(String(cursor.id), String(post._id));
  });

  it("refuses anything it did not make", () => {
    for (const bad of [undefined, "", "page=2", "2026-11-20T12:00:00.000Z", "2026-11-20T12:00:00.000Z_nothex", "2026-13-45T12:00:00.000Z_" + "a".repeat(24)]) {
      assert.equal(parseCursor(bad), null, String(bad));
    }
  });
});

describe("feed and stories", () => {
  let memoryServer;

  before(async () => {
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri("prome-feed-test"));
    await InstructorProfile.syncIndexes();
  });

  beforeEach(async () => {
    await InstructorProfile.deleteMany({});
    await User.deleteMany({});
  });

  after(async () => {
    await mongoose.disconnect();
    await memoryServer.stop();
  });

  let adi = 10000;
  const instructor = async (name, posts, { published = true, verified = false } = {}) => {
    const user = await User.create({
      name,
      email: `${name.toLowerCase().replace(/\W/g, "")}@example.com`,
      password: "x".repeat(60),
      role: "enterprise",
      providerType: "driving_instructor",
    });
    adi += 1;
    return InstructorProfile.create({
      userId: user._id,
      adiNumber: `ADI-${adi}`,
      counties: ["dublin"],
      testCentres: ["finglas"],
      licenceCategories: ["B"],
      transmission: ["manual"],
      isPublished: published,
      verification: { status: verified ? "verified" : "unverified" },
      posts: posts.map(([caption, hoursAgo]) => ({ url: `https://example.com/${caption}.jpg`, caption, postedAt: at(hoursAgo) })),
    });
  };

  it("shows every listed instructor's posts, newest first, with who posted them", async () => {
    await instructor("Aoife Byrne", [["car", 30], ["pass", 2]], { verified: true });
    await instructor("Cian Murphy", [["hills", 5]]);
    await instructor("Hidden Draft", [["draft", 1]], { published: false });

    const { posts, next } = await readFeed();
    assert.deepEqual(posts.map((post) => post.caption), ["pass", "hills", "car"]);
    assert.equal(posts[0].author.name, "Aoife Byrne");
    assert.equal(posts[0].author.isVerified, true);
    assert.equal(posts[1].author.isVerified, false);
    assert.equal(next, null);
  });

  it("pages with the cursor without losing or repeating a post, even at the same moment", async () => {
    /* Five posts, three of them in the same millisecond, read two at a time. */
    await instructor("Aoife Byrne", [["a", 1], ["b", 3], ["c", 3]]);
    await instructor("Cian Murphy", [["d", 3], ["e", 9]]);

    const seen = [];
    let cursor = null;
    for (let page = 0; page < 5; page++) {
      const result = await readFeed({ cursor, limit: 2 });
      seen.push(...result.posts.map((post) => post.caption));
      if (!result.next) break;
      cursor = parseCursor(result.next);
    }
    assert.equal(seen.length, 5);
    assert.deepEqual(new Set(seen), new Set(["a", "b", "c", "d", "e"]));
    assert.equal(seen[0], "a");
    assert.equal(seen[4], "e");
  });

  it("puts in stories only the instructors who posted this week, latest first, each oldest first", async () => {
    await instructor("Aoife Byrne", [["old", 24 * 9], ["monday", 24 * 4], ["today", 3]]);
    await instructor("Cian Murphy", [["yesterday", 26]]);
    await instructor("Niamh Walsh", [["last month", 24 * 30]]);
    await instructor("Hidden Draft", [["draft", 1]], { published: false });

    const stories = await readStories(NOW);
    assert.deepEqual(stories.map((story) => story.author.name), ["Aoife Byrne", "Cian Murphy"]);
    assert.deepEqual(stories[0].posts.map((post) => post.caption), ["monday", "today"]);
  });
});
