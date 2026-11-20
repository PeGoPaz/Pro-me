import mongoose from "mongoose";

import InstructorProfile from "../models/InstructorProfile.js";
import { avatarProjection, publicAvatarUrl } from "./avatar.js";

/*
 * The home page feed and stories: every listed instructor's posts, newest
 * first, and the instructors who posted in the last week.
 */

export const FEED_PAGE = 12;
export const STORY_DAYS = 7;

/*
 * The feed pages with a cursor, not a page number: new posts keep arriving at
 * the top, and with "page 2" each one would push a post seen on page 1 onto
 * page 2 again. The cursor is the last post shown - its time and its id, since
 * two posts can go up in the same millisecond and a time alone would skip one
 * of them at the edge of a page.
 */
export const makeCursor = (post) => `${new Date(post.postedAt).toISOString()}_${post._id ?? post.id}`;

/* The cursor's parts, or null if it is not one we made. */
export const parseCursor = (cursor) => {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_([0-9a-f]{24})$/.exec(String(cursor ?? ""));
  if (!match) return null;
  const postedAt = new Date(match[1]);
  return Number.isNaN(postedAt.getTime()) ? null : { postedAt, id: new mongoose.Types.ObjectId(match[2]) };
};

/* Only the fields a post's header needs, of the instructor and their account. */
const authorStages = [
  {
    $lookup: {
      from: "users",
      let: { uid: "$userId" },
      pipeline: [
        { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
        { $project: { name: 1, updatedAt: 1, avatarUrl: avatarProjection } },
      ],
      as: "user",
    },
  },
  { $unwind: "$user" },
];

const author = (row) => ({
  id: row._id,
  userId: row.userId,
  name: row.user.name,
  /* The chosen profile photo, else the account avatar - as a link, never data. */
  photo: row.profilePhotoUrl || publicAvatarUrl(row.user),
  isVerified: row.verification?.status === "verified",
  acceptingNewStudents: row.acceptingNewStudents ?? false,
});

const postView = (post) => ({ id: post._id, url: post.url, caption: post.caption ?? "", postedAt: post.postedAt });

/* One page of the feed, after `cursor` when given. `next` is the cursor for
   the page after this one, or null when there are no older posts. */
export const readFeed = async ({ cursor = null, limit = FEED_PAGE } = {}) => {
  const after = cursor
    ? [{
      $match: {
        $or: [
          { "posts.postedAt": { $lt: cursor.postedAt } },
          { "posts.postedAt": cursor.postedAt, "posts._id": { $lt: cursor.id } },
        ],
      },
    }]
    : [];
  const rows = await InstructorProfile.aggregate([
    /* Only listed profiles, as in search; the multikey index on posts.postedAt
       keeps this from reading every profile. */
    { $match: { isPublished: true, "posts.0": { $exists: true } } },
    { $project: { userId: 1, profilePhotoUrl: 1, verification: 1, acceptingNewStudents: 1, posts: 1 } },
    { $unwind: "$posts" },
    ...after,
    { $sort: { "posts.postedAt": -1, "posts._id": -1 } },
    /* One more than a page, to know whether there is a next one. */
    { $limit: limit + 1 },
    ...authorStages,
  ]);
  const page = rows.slice(0, limit);
  return {
    posts: page.map((row) => ({ ...postView(row.posts), author: author(row) })),
    next: rows.length > limit ? makeCursor(page[page.length - 1].posts) : null,
  };
};

/* The instructors who posted in the last STORY_DAYS, most recent first, each
   with those posts oldest first - the order a story plays in. */
export const readStories = async (now = new Date()) => {
  const since = new Date(now.getTime() - STORY_DAYS * 24 * 60 * 60 * 1000);
  const rows = await InstructorProfile.aggregate([
    { $match: { isPublished: true, "posts.postedAt": { $gte: since } } },
    {
      $project: {
        userId: 1, profilePhotoUrl: 1, verification: 1, acceptingNewStudents: 1,
        posts: { $filter: { input: "$posts", cond: { $gte: ["$$this.postedAt", since] } } },
      },
    },
    ...authorStages,
  ]);
  return rows
    .map((row) => ({
      author: author(row),
      posts: [...row.posts].sort((a, b) => a.postedAt - b.postedAt).map(postView),
    }))
    .sort((a, b) => b.posts[b.posts.length - 1].postedAt - a.posts[a.posts.length - 1].postedAt);
};
