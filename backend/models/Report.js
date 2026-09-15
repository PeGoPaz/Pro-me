import mongoose from "mongoose";

/*
 * Notice-and-action reports — DSA (Regulation EU 2022/2065) Article 16.
 *
 * Pro.me stores and publicly disseminates profiles, photos and reviews, which
 * makes it a hosting service and an online platform. As a micro/small
 * enterprise, Article 19 exempts it from most of the Section 3 obligations —
 * but NOT from Article 16. A working report mechanism is a launch requirement,
 * not a nice-to-have.
 *
 * Adjacent articles this schema is shaped to satisfy:
 *   Art. 16 — anyone can flag illegal content, including anonymously.
 *   Art. 17 — a statement of reasons is owed whenever we act on content.
 *   Art. 18 — suspected criminal offences get reported to the authorities.
 *             Teaching for reward without an ADI permit is one, which is
 *             exactly what the "not_an_adi" reason exists to capture.
 *   Art. 24(3) — an annual moderation transparency report, the one Section 3
 *             duty that survives the Art. 19 exclusion. The status and
 *             timestamps here are what make those numbers countable.
 */

const reportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["profile", "review", "service"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    /* Null for an anonymous report. Article 16 does not let us require an
       account to flag illegal content. */
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    /* Optional contact address for an anonymous reporter, so a statement of
       reasons can still reach them. */
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    reason: {
      type: String,
      enum: [
        "not_an_adi",        // claiming to instruct without being on the register
        "fake_profile",
        "fake_reviews",
        "inappropriate_photo",
        "harassment",
        "unsafe_conduct",
        "spam",
        "other",
      ],
      required: true,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    status: {
      type: String,
      enum: ["received", "reviewing", "actioned", "dismissed"],
      default: "received",
    },

    /* Article 17: what we decided and why, sent to the people affected. */
    statementOfReasons: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    /* Article 18: set when we escalate a suspected criminal offence. */
    referredToAuthoritiesAt: { type: Date, default: null },

    handledAt: { type: Date, default: null },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

/* The moderation queue: oldest unhandled first. */
reportSchema.index({ status: 1, createdAt: 1 });
/* Every report against one profile, for spotting patterns. */
reportSchema.index({ targetType: 1, targetId: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
