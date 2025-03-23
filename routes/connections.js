import express from "express";
import Connection from "../models/Connection.js"; 
import User from "../models/User.js"; 
import { io } from "../server.js"; 

const router = express.Router();
router.post("/request", async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    const existingRequest = await Connection.findOne({
      senderId,
      receiverId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent!" });
    }
    const newRequest = new Connection({
      senderId,
      receiverId,
      status: "pending",
    });
    await newRequest.save();

    io.to(receiverId).emit("friendRequestReceived", { senderId });

    res.status(200).json({ message: "Friend request sent!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/requests/:userId", async (req, res) => {
  try {
    const requests = await Connection.find({
      receiverId: req.params.userId,
      status: "pending",
    }).populate("senderId", "username"); 

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/accept", async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    const updatedRequest = await Connection.findOneAndUpdate(
      { senderId, receiverId, status: "pending" },
      { status: "accepted" },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(400).json({ message: "Request not found!" });
    }
    io.to(senderId).emit("friendRequestAccepted", { senderId, receiverId });
    io.to(receiverId).emit("friendRequestAccepted", { senderId, receiverId });

    res.status(200).json({ message: "Friend request accepted!" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reject", async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    const deletedRequest = await Connection.findOneAndDelete({
      senderId,
      receiverId,
      status: "pending",
    });

    if (!deletedRequest) {
      return res.status(400).json({ message: "Request not found!" });
    }

    io.to(senderId).emit("friendRequestRejected", { senderId, receiverId });

    res.status(200).json({ message: "Friend request rejected!" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/status/:userId/:recipientId", async (req, res) => {
  try {
    const connection = await Connection.findOne({
      $or: [
        {
          senderId: req.params.userId,
          receiverId: req.params.recipientId,
          status: "accepted",
        },
        {
          senderId: req.params.recipientId,
          receiverId: req.params.userId,
          status: "accepted",
        },
      ],
    });

    res.status(200).json({ connected: !!connection });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
