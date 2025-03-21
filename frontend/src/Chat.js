import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

const Chat = ({ user, recipient }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [requestSent, setRequestSent] = useState(false);
  const [allMessages, setAllMessages] = useState([]);
  const [text,setText] = useState("");
  useEffect(() => {
    if (user?._id) {
      socket.emit("joinRoom", { userId: user._id });
    }
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/${user._id}/${recipient._id}`
        );
        setAllMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    if (isConnected && recipient) {
      fetchMessages();
    }
  }, [user, recipient, isConnected]);
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/connections/status/${user._id}/${recipient._id}`
        );
        setIsConnected(res.data.connected);
      } catch (err) {
        console.error("Error checking connection:", err);
      }
    };

    if (recipient) {
      checkConnection();
    }
  }, [user, recipient]);
  useEffect(() => {

    socket.on("receiveMessage", (message) => {
      if (message.receiverId === user._id) {
        setAllMessages((prev) => [...prev, message]);

        if (message.senderId !== recipient._id) {
          alert(`New message from ${message.senderId}!`);
        }
      }
    });

    socket.on("friendRequestReceived", (data) => {
      if (data.receiverId === user._id) {
        setFriendRequests((prev) => [...prev, data.senderId]);
      }
    });

    socket.on("friendRequestAccepted", (data) => {
      if (data.senderId === user._id || data.receiverId === user._id) {
        setIsConnected(true);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("friendRequestReceived");
      socket.off("friendRequestAccepted");
    };
  }, [user,recipient]);


  const sendMessage = async () => {
    if (text.trim()) {
      const newMessage = {
        senderId: user._id,
        receiverId: recipient._id,
        message: text,
      };

      setAllMessages((prev) => [...prev, newMessage]);
      socket.emit("sendMessage", newMessage);
      await axios.post("http://localhost:5000/api/messages", newMessage);
      setText("");
    }
  };
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/connections/requests/${user._id}`);
        setFriendRequests(res.data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      }
    };

    fetchRequests();
  }, [user,recipient]);
  const sendFriendRequest = async () => {
    try {
      await axios.post("http://localhost:5000/api/connections/request", {
        senderId: user._id,
        receiverId: recipient._id,
      });
      setRequestSent(true);
      alert("Friend request sent!");
    } catch (err) {
      console.error("Error sending request:", err);
    }
  };
  const acceptRequest = async (senderId) => {
    try {
      await axios.post("http://localhost:5000/api/connections/accept", {
        senderId,
        receiverId: user._id,
      });

      setFriendRequests(friendRequests.filter((req) => req.senderId !== senderId));
      setIsConnected(true);
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };
  const messages = allMessages.filter(
    (msg) =>
      (msg.senderId === user._id && msg.receiverId === recipient._id) ||
      (msg.senderId === recipient._id && msg.receiverId === user._id)
  );


  return (
    <div style={styles.chatContainer}>
      <h3>Chat with {recipient.username}</h3>
      {friendRequests.length > 0 &&
        friendRequests.map((req) => (
          <div key={req.senderId} style={styles.requestBox}>
            <p>{req.senderId.username} sent you a friend request.</p>
            <button onClick={() => acceptRequest(req.senderId)} style={styles.acceptButton}>
              Accept
            </button>
          </div>
        ))}

      {isConnected ? (
        <>
        <p> You are now connected with {recipient.username}. Start chatting!</p>
        <div style={styles.messagesContainer}>
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.messageBubble,
                    backgroundColor: msg.senderId === user._id ? "green" : "blue",
                    alignSelf: msg.senderId === user._id ? "flex-start" : "flex-end",
                  }}
                >
                  <strong>{msg.senderId === user._id ? "Me" : recipient.username}:</strong> {msg.message}
                </div>
              ))
            ) : (
              <p>No messages yet.</p>
            )}
          </div>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={styles.input}
            />
            <button onClick={sendMessage} style={styles.sendButton}>
              Send
            </button>
          </div>
          </>
      ) : (
        !requestSent && (
          <button onClick={sendFriendRequest} style={styles.requestButton}>
            Send Friend Request
          </button>
        )
      )}
    </div>
    
  );
};

export default Chat;
const styles = {
  chatContainer: {
    maxWidth: "500px",
    margin: "auto",
    border: "1px solid #ccc",
    borderRadius: "10px",
    padding: "20px",
    backgroundColor: "#f9f9f9",
  },
  messagesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "400px",
    overflowY: "auto",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    backgroundColor: "#fff",
  },
  messageBubble: {
    padding: "10px",
    borderRadius: "10px",
    color: "white",
    maxWidth: "70%",
    wordWrap: "break-word",
  },
  inputContainer: {
    display: "flex",
    marginTop: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  sendButton: {
    padding: "10px",
    marginLeft: "5px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
  },
  requestBox: { margin: "10px 0", padding: "10px", border: "1px solid #ddd", borderRadius: "5px" },
  acceptButton: { backgroundColor: "green", color: "white", padding: "5px", border: "none", cursor: "pointer" },
  requestButton: { backgroundColor: "#007bff", color: "white", padding: "10px", border: "none", cursor: "pointer" },
};
