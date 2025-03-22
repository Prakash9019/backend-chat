const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User.js");


dotenv.config();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered!" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      user: { _id: user._id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "username email _id");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: "Error fetching users" });
  }
});
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, { password: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;