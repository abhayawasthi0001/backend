require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// CORS configuration
const corsOptions = {
  origin: "https://abhayawasthi0001.github.io/myapp/", // Replace with your GitHub Pages URL
  methods: ["GET", "POST", "DELETE"],
  credentials: true,
};
app.use(cors(corsOptions));

// Express built-in middleware for JSON parsing
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

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

// Signup or login
app.post("/signup", async (req, res) => {
  try {
    const { name, password } = req.body;

    const existingUser = await User.findOne({ name });

    if (existingUser) {
      if (existingUser.password === password) {
        // Return todos for existing user
        return res
          .status(200)
          .json({ message: "User already exists!", todos: existingUser.todos });
      } else {
        return res
          .status(401)
          .json({ error: "Username exists but password is incorrect." });
      }
    }

    const newUser = new User({
      name,
      password,
      todos: [],
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Add a new todo
app.post("/addTodo", async (req, res) => {
  try {
    const { name, title, data } = req.body;

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

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
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ todos: user.todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// Delete a todo
app.delete("/deleteTodo", async (req, res) => {
  try {
    const { name, todoId } = req.body;

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const todoIndex = user.todos.findIndex(
      (todo) => todo._id.toString() === todoId
    );
    if (todoIndex === -1) {
      return res.status(404).json({ error: "Todo not found" });
    }

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
