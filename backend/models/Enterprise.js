import mongoose from "mongoose";

const enterpriseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        /* Narrowed from the old multi-vertical marketplace. The platform is
           Ireland-first for driving instructors; "Other" is the fallback for
           non-driving businesses until they get their own vertical. */
        enum: ["Driving", "Other"],
        default: "Other",
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    availability: {
        type: String,
        trim: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const Enterprise = mongoose.model("Enterprise", enterpriseSchema);

export default Enterprise;
