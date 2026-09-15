import express from "express";
import bcrypt from "bcrypt";
import validator from "validator";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, providerType } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Input validation
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Name must be between 2 and 50 characters" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ 
        message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
      });
    }

    if (!["user", "enterprise"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    /* Providers must say which vertical they are in. Onboarding offers only
       driving instructor or the generic "other" fallback. */
    if (role === "enterprise" && !["driving_instructor", "other"].includes(providerType)) {
      return res.status(400).json({
        message: "Providers must choose a provider type of driving_instructor or other",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      ...(role === "enterprise" ? { providerType } : {}),
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        providerType: newUser.providerType,
        avatarUrl: newUser.avatarUrl || "",
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      avatarUrl: user.avatarUrl || "",
    };

    // Regenerate session ID to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration failed:", err);
        return res.status(500).json({ message: "Login failed" });
      }

      // Re-set user data after regeneration
      req.session.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        avatarUrl: user.avatarUrl || "",
      };

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || "",
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get user error:", error.message);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
});

router.patch("/me/avatar", requireAuth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (avatarUrl !== null && typeof avatarUrl !== "string") {
      return res.status(400).json({ message: "avatarUrl must be a string or null" });
    }

    const trimmedAvatar = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
    
    // Validate data URL format more strictly
    if (trimmedAvatar) {
      if (!trimmedAvatar.startsWith("data:image/")) {
        return res.status(400).json({ message: "avatarUrl must be a valid image data URL" });
      }
      
      // Only allow specific image types
      const allowedTypes = ["data:image/png", "data:image/jpeg", "data:image/jpg", "data:image/webp"];
      if (!allowedTypes.some(type => trimmedAvatar.startsWith(type))) {
        return res.status(400).json({ message: "Only PNG, JPEG, and WebP images are allowed" });
      }
    }
    
    if (trimmedAvatar.length > 2_000_000) { // Reduced from 4MB to 2MB
      return res.status(400).json({ message: "Avatar image is too large (max 2MB)" });
    }

    const user = await User.findByIdAndUpdate(
      req.session.user.id,
      { avatarUrl: trimmedAvatar },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.session.user.avatarUrl = user.avatarUrl || "";

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Avatar update error:", error.message);
    return res.status(500).json({ message: "Failed to update avatar" });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie("pro.me.sid");
    return res.status(200).json({ message: "Logout successful" });
  });
});

export default router;
