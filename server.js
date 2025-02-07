require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());

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
          .send("Username exists but password is incorrect.");
      }
    }

    const newUser = new User({
      name,
      password,
      todos: [],
    });

    await newUser.save();
    res.status(201).send("User created successfully!");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Server error");
  }
});

// Add a new todo
app.post("/addTodo", async (req, res) => {
  try {
    const { name, title, data } = req.body;

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const newTodo = { title, data };
    user.todos.push(newTodo);

    await user.save();
    res
      .status(201)
      .json({ message: "Todo added successfully!", todo: newTodo });
  } catch (error) {
    console.error("Error adding todo:", error);
    res.status(500).send("Server error");
  }
});

// Fetch todos for a user
app.get("/todos", async (req, res) => {
  try {
    const { name } = req.query;
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.status(200).json({ todos: user.todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).send("Server error");
  }
});

// Delete a todo
app.delete("/deleteTodo", async (req, res) => {
  try {
    const { name, todoId } = req.body;

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const todoIndex = user.todos.findIndex(
      (todo) => todo._id.toString() === todoId
    );
    if (todoIndex === -1) {
      return res.status(404).send("Todo not found");
    }

    user.todos.splice(todoIndex, 1);
    await user.save();

    res.status(200).json({ message: "Todo deleted successfully!" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res.status(500).send("Server error");
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
