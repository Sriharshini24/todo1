const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai'); // Import OpenAI package

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://harshini:harshini@cluster0.v6qpg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Task Model
const taskSchema = new mongoose.Schema({
  name: String,
  description: String,
  priority: String,
  deadline: String,
  completed: { type: Boolean, default: false },
  chatGPTResponse: { type: String, default: '' } // New field for ChatGPT response
});
const Task = mongoose.model('Task', taskSchema);

// Routes

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
});

// Add a new task
app.post('/tasks', async (req, res) => {
  try {
    const { name, description, priority, deadline, completed } = req.body;
    const newTask = new Task({ name, description, priority, deadline, completed });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error adding task', error });
  }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
});

// Update a task
app.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error });
  }
});

// Ask OpenAI for "How to do task"
app.post('/ask', async (req, res) => {
  const { question, taskId } = req.body;

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: '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' // Your OpenAI API key
  });

  try {
    // Use the OpenAI chat model to get the answer
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: question }],
      model: 'gpt-4'
    });

    // Extract the answer
    const answer = response.choices[0].message.content.trim();

    // Save the answer to the corresponding task in the database
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { chatGPTResponse: answer },
      { new: true }
    );

    // Send the answer back to the frontend
    res.json({ answer, updatedTask });
  } catch (error) {
    console.error('Error communicating with OpenAI:', error);
    res.status(500).json({ message: 'Error fetching answer from OpenAI' });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
