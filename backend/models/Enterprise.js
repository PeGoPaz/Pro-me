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
        enum: ["Barber", "Driving", "Tutoring", "Beauty & Spa", "Health & Wellness", "Other"],
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
