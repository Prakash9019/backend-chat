import { useState, useEffect } from "react";
import axios from "axios";
import Chat from "./Chat";

function App() {
  const [user, setUser] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [users, setUsers] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      console.log("Fetching users...");
      const res = await axios.get("http://localhost:5000/api/auth/users");
      console.log("Users fetched:", res.data);
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      setLoading(true);
      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });
      alert("Registration successful! Now log in.");
      setIsRegistering(false);
    } catch (err) {
      console.error("Registration failed:", err);
      alert(err.response?.data?.message || "Error registering user.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const { user, token } = res.data;
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    } catch (err) {
      console.error("Login failed:", err);
      alert(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setRecipient(null);
  };

  return (
    <div>
      {!user ? (
        isRegistering ? (
          <Register
            onRegister={handleRegister}
            switchToLogin={() => setIsRegistering(false)}
            loading={loading}
          />
        ) : (
          <Login
            onLogin={handleLogin}
            switchToRegister={() => setIsRegistering(true)}
            loading={loading}
          />
        )
      ) : (
        <div>
          <h2>Welcome {user.username}</h2>
          <button onClick={handleLogout}>Logout</button>
          <h3>Select a user to chat with:</h3>
          {users.length === 0 ? (
            <p>No users found.</p>
          ) : (
            users
              .filter((u) => u._id !== user._id)
              .map((u) => (
                <button key={u._id} onClick={() => setRecipient(u)}>
                  {u.username}
                </button>
              ))
          )}
          {recipient && <Chat user={user} recipient={recipient} />}
        </div>
      )}
    </div>
  );
}

const Login = ({ onLogin, switchToRegister, loading }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={() => onLogin(email, password)} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      <p>
        Don't have an account?{" "}
        <button onClick={switchToRegister}>Register</button>
      </p>
    </div>
  );
};

const Register = ({ onRegister, switchToLogin, loading }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={() => onRegister(username, email, password)}
        disabled={loading}
      >
        {loading ? "Registering..." : "Register"}
      </button>
      <p>
        Already have an account? <button onClick={switchToLogin}>Login</button>
      </p>
    </div>
  );
};

export default App;
