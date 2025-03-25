const express = require("express");
const Connection = require("../models/Connection.js");

const router = express.Router();

// 📌 Send Friend Request
router.post("/request", async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    // Check if a request already exists
    const existingRequest = await Connection.findOne({
      senderId,
      receiverId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent!" });
    }

    // Create a new friend request
    const newRequest = new Connection({ senderId, receiverId, status: "pending" });
    await newRequest.save();

    // Notify receiver via WebSocket
    const io = req.app.get("io");
    io.to(receiverId).emit("friendRequestReceived", { senderId });

    res.status(200).json({ message: "Friend request sent!" });
  } catch (error) {
    console.error("Error in sending request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Fetch Pending Requests
router.get("/requests/:userId", async (req, res) => {
  try {
    const requests = await Connection.find({
      receiverId: req.params.userId,
      status: "pending",
    }).populate("senderId", "username");
    console.log(requests);
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Accept Friend Request
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

    // Notify both users
    const io = req.app.get("io");
    io.to(senderId).emit("friendRequestAccepted", { senderId, receiverId });
    io.to(receiverId).emit("friendRequestAccepted", { senderId, receiverId });

    res.status(200).json({ message: "Friend request accepted!" });
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Reject Friend Request
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

    // Notify sender
    const io = req.app.get("io");
    io.to(senderId).emit("friendRequestRejected", { senderId, receiverId });

    res.status(200).json({ message: "Friend request rejected!" });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all accepted connections where the user is either sender or receiver
    const connections = await Connection.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: "accepted",
    }).populate("senderId receiverId", "username");

    // Extract the connected user details
    const connectedUsers = connections.map((conn) =>
      conn.senderId._id.toString() === userId ? conn.receiverId : conn.senderId
    );

    res.status(200).json(connectedUsers);
  } catch (error) {
    console.error("Error fetching connections:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// 📌 Get Connection Status (Updated)
router.get("/status/:userId/:recipientId", async (req, res) => {
  try {
    const { userId, recipientId } = req.params;

    // Check if users are connected
    const connection = await Connection.findOne({
      $or: [
        { senderId: userId, receiverId: recipientId, status: "accepted" },
        { senderId: recipientId, receiverId: userId, status: "accepted" },
      ],
    });

    // Check if there is a pending request
    const pendingRequest = await Connection.findOne({
      $or: [
        { senderId: userId, receiverId: recipientId, status: "pending" },
        { senderId: recipientId, receiverId: userId, status: "pending" },
      ],
    });

    if (connection) {
      return res.status(200).json({ status: "connected" });
    } else if (pendingRequest) {
      return res.status(200).json({ status: "pending" });
    } else {
      return res.status(200).json({ status: "not_connected" });
    }
  } catch (error) {
    console.error("Error checking connection status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
