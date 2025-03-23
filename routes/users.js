import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Search Users
router.get("/search", async (req, res) => {
  const { query } = req.query;
  try {
    const users = await User.find({
      username: { $regex: query, $options: "i" },
    }).select("username _id");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
