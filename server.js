require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// CORS configuration
const corsOptions = {
  origin: ["https://abhayawasthi0001.github.io", "http://localhost:3000"],
  methods: ["GET", "POST", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// JSON parsing middleware
app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  todos: [
    {
      title: { type: String, required: true },
      data: { type: String, required: true },
    },
  ],
});
const User = mongoose.model("User", userSchema);

// Nodemailer setup with explicit SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify Nodemailer configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer configuration error:", error);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});

// Function to send admin login email
const sendAdminLoginEmail = async () => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "abhayawasthiforaws7@gmail.com",
    subject: "Admin Login Alert",
    text: `Admin "Abhay Awasthi" logged in at ${new Date().toLocaleString()}.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Email send failed:", error);
    throw error;
  }
};

// Signup or login endpoint
app.post("/signup", async (req, res) => {
  try {
    const { name, password } = req.body;

    const existingUser = await User.findOne({ name });

    if (existingUser) {
      if (existingUser.password === password) {
        if (name === "Abhay Awasthi" && password === "Abhay7@123") {
          await sendAdminLoginEmail(); // Send email on admin login
        }
        return res
          .status(200)
          .json({ message: "Login successful!", todos: existingUser.todos });
      } else {
        return res
          .status(401)
          .json({ error: "Username exists but password is incorrect." });
      }
    }

    const newUser = new User({ name, password, todos: [] });
    await newUser.save();
    res.status(201).json({ message: "User created successfully!", todos: [] });
  } catch (error) {
    console.error("Error in /signup endpoint:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Add a new todo
app.post("/addTodo", async (req, res) => {
  try {
    const { name, title, data } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ error: "User not found" });

    const newTodo = { title, data };
    user.todos.push(newTodo);
    await user.save();
    res
      .status(201)
      .json({ message: "Todo added successfully!", todo: newTodo });
  } catch (error) {
    console.error("Error adding todo:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Fetch todos for a user
app.get("/todos", async (req, res) => {
  try {
    const { name } = req.query;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ todos: user.todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Fetch all users except admin
app.get("/admin/users", async (req, res) => {
  try {
    const { name, password } = req.query;
    if (name !== "Abhay Awasthi" || password !== "Abhay7@123")
      return res.status(403).json({ error: "Unauthorized access" });
    const users = await User.find({ name: { $ne: "Abhay Awasthi" } });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Delete a user (admin only)
app.delete("/admin/deleteUser", async (req, res) => {
  try {
    const { name, password, userId } = req.body;
    if (name !== "Abhay Awasthi" || password !== "Abhay7@123")
      return res.status(403).json({ error: "Unauthorized access" });
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Delete a todo
app.delete("/deleteTodo", async (req, res) => {
  try {
    const { name, todoId } = req.body;
    const user = await User.findOne({ name });
    if (!user) return res.status(404).json({ error: "User not found" });

    const todoIndex = user.todos.findIndex(
      (todo) => todo._id.toString() === todoId
    );
    if (todoIndex === -1)
      return res.status(404).json({ error: "Todo not found" });

    user.todos.splice(todoIndex, 1);
    await user.save();
    res.status(200).json({ message: "Todo deleted successfully!" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
