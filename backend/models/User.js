import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "enterprise"]
    },
    /* Which kind of business this provider runs. Onboarding is deliberately
       limited to these two: driving instructors are the launch vertical and
       "other" is the generic fallback. Only meaningful for role "enterprise". */
    providerType: {
        type: String,
        enum: ["driving_instructor", "other"],
        required: function () {
            return this.role === "enterprise";
        },
        default: undefined
    },
    avatarUrl: {
        type: String,
        trim: true,
        default: ""
    }
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;
