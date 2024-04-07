const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user');
const Admin = require('../models/admin');
const moment = require('moment');

// Generate a random username, key, and expiry
// Generate a random username, key, and expiry
router.post('/generate', async (req, res) => {
  try {
    const { key, username, expiry } = req.body;

    // Check if all parameters are provided
    if (!key || !username || !expiry) {
      return res.status(400).json({ message: "Please provide key, username, and expiry." });
    }

    const currentDate = new Date(); // Get the current date and time

    const expiryDate = new Date(currentDate.getTime() + Number(expiry) * 24 * 60 * 60 * 1000); // Adding expiry days in milliseconds

    // Create new user
    const newUser = new User({ username, key, expires_in: expiryDate, generated_at: currentDate }); // Add generated_at field
    await newUser.save();

    res.json({ username: newUser.username, key: newUser.key, expires_in: newUser.expires_in, generated_at: newUser.generated_at }); // Include generated_at in the response
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: error.message });
  }
});

// Login API endpoint
router.post('/login', async (req, res) => {
  try { 
    const { username, key  } = req.body;

    if (!username || !key) {
      return res.status(400).json({ message: "Please provide username and key for login." });
    }

    let user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Verify the key (password)
    if (user.key !== key) {
      return res.status(401).json({ message: "Invalid key." });
    }

    // Check if a session already exists and is valid
    if (user.sessionToken && user.sessionExpires > new Date()) {
      return res.status(409).json({ message: "User is already logged in." });
    }

    // Invalidate existing session if any
    user.sessionToken = null;
    user.sessionExpires = null;

    // Generate a unique session token
    const sessionToken = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET_KEY, { expiresIn: Math.floor((user.expires_in - Date.now()) / 1000) }); // Use expiry from the database

    user.sessionToken = sessionToken;
    user.sessionExpires = user.expires_in; // Set session expiration to the expiry stored in the database

    await user.save();

    res.json({ sessionToken, sessionExpires: user.sessionExpires, message: "User is valid."});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Retrieve all users endpoint
router.get('/user', async (req, res) => {
  try {
    // Find all users in the database
    const users = await User.find({}, 'username key expires_in generated_at');

    // Extract username, key, and expires_in from each user
    const userData = users.map(user => ({
      username: user.username,
      key: user.key,
      expires_in: user.expires_in,
      generated_at: user.generated_at // Include expires_in field
    }));

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user endpoint
router.delete('/user/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // Find the user by username and delete it
    const deletedUser = await User.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User deleted successfully.", user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
