import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Low');
  const [deadline, setDeadline] = useState('');
  const [completed, setCompleted] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [filter, setFilter] = useState('All');
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Success message state

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/tasks');
      setTasks(response.data);
      setSuccessMessage(''); // Reset success message when tasks are fetched
    } catch (error) {
      setError('Error fetching tasks!');
      console.error('There was an error fetching the tasks!', error);
    }
  };

  const validateDeadline = (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date >= today;
  };

  const addTask = async () => {
    if (deadline && !validateDeadline(deadline)) {
      setError('Task deadline should not be before today.');
      return;
    }

    const newTask = { name, description, priority, deadline, completed };
    try {
      await axios.post('http://localhost:5000/tasks', newTask);
      setName('');
      setDescription('');
      setPriority('Low');
      setDeadline('');
      setError('');
      setSuccessMessage('Task added successfully!');
      fetchTasks();
    } catch (error) {
      setError('Error adding task!');
      console.error('There was an error adding the task!', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/tasks/${id}`);
      setSuccessMessage('Task deleted successfully!');
      fetchTasks();
    } catch (error) {
      setError('Error deleting task!');
      console.error('There was an error deleting the task!', error);
    }
  };

  const toggleComplete = async (id) => {
    const task = tasks.find((task) => task._id === id);
    try {
      await axios.put(`http://localhost:5000/tasks/${id}`, {
        ...task,
        completed: !task.completed,
      });
      fetchTasks();
    } catch (error) {
      setError('Error updating task status!');
      console.error('There was an error updating the task status!', error);
    }
  };

  const startUpdate = (task) => {
    setUpdatingTask(task);
    setName(task.name);
    setDescription(task.description);
    setPriority(task.priority);
    setDeadline(task.deadline);
  };

  const updateTask = async () => {
    if (deadline && !validateDeadline(deadline)) {
      setError('Task deadline should not be before today.');
      return;
    }

    const updatedTask = { name, description, priority, deadline, completed };
    try {
      await axios.put(`http://localhost:5000/tasks/${updatingTask._id}`, updatedTask);
      setUpdatingTask(null);
      setName('');
      setDescription('');
      setPriority('Low');
      setDeadline('');
      setError('');
      setSuccessMessage('Task updated successfully!');
      fetchTasks();
    } catch (error) {
      setError('Error updating task!');
      console.error('There was an error updating the task!', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'Completed') return task.completed;
    if (filter === 'Incomplete') return !task.completed;
    if (filter === 'High Priority') return task.priority === 'High';
    if (filter === 'Medium Priority') return task.priority === 'Medium';
    if (filter === 'Low Priority') return task.priority === 'Low';
    return true;
  });

  const askQuestion = async (taskId, taskName, taskDescription) => {
    if (answers[taskId]) {
      return; // Prevent making the same request again for the same task
    }
    try {
      const response = await axios.post('http://localhost:5000/ask', {
        question: `How to do the task "${taskName}"? Description: ${taskDescription} in 5 points`,
        taskId: taskId, // Pass taskId to save the response in the database
      });
  
      const points = response.data.answer.split('\n').slice(0, 8).map((line, index) => {
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          return (
            <li key={index}>
              {line.trim().slice(1).trim()}
            </li>
          );
        }
        return <li key={index}>{line.trim()}</li>;
      });
  
      // Add the ChatGPT response to the existing answers for the task
      setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [taskId]: [
          ...(prevAnswers[taskId] || []), // Keep previous answers
          ...points, // Add the new response points
        ],
      }));
  
      // Update the task with the ChatGPT response in the task list
      const updatedTask = response.data.updatedTask;
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );
  
    } catch (error) {
      setError('Error fetching response from GPT!');
      console.error('Error fetching response from GPT:', error);
    }
  };
  
  

  return (
    <div className="App">
      <h1>To-Do List</h1>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="add-task">
        <h2>{updatingTask ? 'Update Task' : 'Add a New Task'}</h2>
        <input
          type="text"
          placeholder="Task Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <button onClick={updatingTask ? updateTask : addTask}>
          {updatingTask ? 'Update Task' : 'Add Task'}
        </button>
      </div>

      <div className="filter-section">
        <h2>Filter Tasks</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Completed">Completed</option>
          <option value="Incomplete">Incomplete</option>
          <option value="High Priority">High Priority</option>
          <option value="Medium Priority">Medium Priority</option>
          <option value="Low Priority">Low Priority</option>
        </select>
      </div>

      <div className="task-container">
        <h2>Task List</h2>
        <table className="task-table">
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {filteredTasks.map((task) => (
              <tr key={task._id}>
                <td>{task.name}</td>
                <td>{task.description}</td>
                <td>{task.priority}</td>
                <td>{task.deadline || 'No deadline'}</td>
                <td>{task.completed ? 'Completed' : 'Incomplete'}</td>
                <td>
                  <button onClick={() => toggleComplete(task._id)}>
                    {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                  </button>
                  <button onClick={() => deleteTask(task._id)}>Delete</button>
                  <button onClick={() => startUpdate(task)}>Update</button>
                  <button onClick={() => askQuestion(task._id, task.name, task.description)}>
                    How to do
                  </button>

                  {/* Display the answers, including ChatGPT's response, in the same answer-box */}
                  {answers[task._id] && (
                    <div className="answer-box">
                      <ul>{answers[task._id]}</ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
