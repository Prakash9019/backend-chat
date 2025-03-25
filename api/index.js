const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("../routes/auth.js");
const messageRoutes = require("../routes/messages.js");
const connectionRoutes = require("../routes/connections.js");
const userRoutes = require("../routes/users.js");
const Connection = require("../models/Connection.js");


dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*" } // Adjust for production if needed
});

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/users", userRoutes);
mongoose
  .connect(`mongodb+srv://plsprakash2003:Surya_2003@cluster0.bpe9m.mongodb.net/Cluster0?retryWrites=true&w=majority`)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

app.put("/api/messages/read", async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    const result = await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );
    io.to(senderId).emit("messagesReadUpdated", {
      senderId,   
      receiverId,   
      updated: result.nModified,
    });
    res.json({ updated: result.nModified });
  } catch (error) {
    console.error("Error updating read receipts:", error);
    res.status(500).json({ error: "Error updating read receipts" });
  }
});

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ userId }) => {
    socket.join(userId);
    console.log(`${userId} joined their personal chat room.`);
  });

  socket.on("sendRequest", ({ senderId, receiverId }) => {
    console.log(`Friend request sent from ${senderId} to ${receiverId}`);
    io.to(receiverId).emit("receiveRequest", { senderId });
  });

  socket.on("acceptRequest", ({ senderId, receiverId }) => {
    console.log(`Friend request accepted by ${receiverId}`);
    io.to(senderId).emit("requestAccepted", { receiverId });
  });

  socket.on("rejectRequest", ({ senderId, receiverId }) => {
    console.log(`Friend request rejected by ${receiverId}`);
    io.to(senderId).emit("requestRejected", { receiverId });
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message, senderName }) => {
    try {
      const connection = await Connection.findOne({
        $or: [
          { senderId, receiverId, status: "accepted" },
          { senderId: receiverId, receiverId: senderId, status: "accepted" },
        ],
      });
      if (connection) {
        const chatMessage = {
          senderId,
          receiverId,
          message,
          senderName,
          timestamp: new Date(),
        };
        io.to(receiverId).emit("receiveMessage", chatMessage);
        io.to(senderId).emit("receiveMessage", chatMessage);
      } else {
        console.log("Messaging blocked - No connection found");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
  

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    socket.rooms.forEach((room) => socket.leave(room));
  });
});

app.get("/", (req, res) => {
  res.json("API is running");
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;