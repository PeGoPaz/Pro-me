import express from "express";
import mongoose from "mongoose";

import User from "../models/User.js";
import { decodeAvatar } from "../utils/avatar.js";

const router = express.Router();

/* GET /api/users/:id/avatar — the image behind a public avatar link.
   Public on purpose: it is shown on public profiles and in search results. */
router.get("/:id/avatar", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).end();
    }

    const user = await User.findById(id).select("avatarUrl").lean();
    const value = user?.avatarUrl;

    if (typeof value === "string" && value.startsWith("https://")) {
      return res.redirect(302, value);
    }

    const image = decodeAvatar(value);
    if (!image) {
      return res.status(404).end();
    }

    /* The link carries ?v=<updatedAt>, so a versioned request can be cached
       for good; an unversioned one only briefly. */
    res.set("Cache-Control", req.query.v ? "public, max-age=31536000, immutable" : "public, max-age=3600");
    res.type(image.type);
    return res.send(image.buffer);
  } catch (error) {
    console.error("Avatar fetch error:", error.message);
    return res.status(500).end();
  }
});

export default router;
