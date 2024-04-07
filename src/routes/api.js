const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user');
const Admin = require('../models/admin');
const moment = require('moment');

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

    res.json({ username: newUser.username, key: newUser.key, expires_in: newUser.expiry, generated_at: newUser.generated_at }); // Include generated_at in the response
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: error.message });
  }
});

router.post('/admin', async (req, res) => {
  try {
    const { password, admin } = req.body;

    // Check if all parameters are provided
    if (!password || !admin) {
      return res.status(400).json({ message: "Please provide admin and password." });
    }

    // Create new admin
    const newAdmin = new Admin({ admin, password });
    await newAdmin.save();

    res.json({ admin: newAdmin.admin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login API endpoint
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
      // Here, you are effectively denying the login request because a valid session exists
      return res.status(409).json({ message: "User is already logged in." }); // HTTP 409 Conflict might be appropriate here
    }

    // Invalidate existing session if any (now redundant due to the check above, but kept for safety)
    user.sessionToken = null;
    user.sessionExpires = null;
    
    // Generate a unique session token
    const sessionToken = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET_KEY, { expiresIn: '7D' });

    // Set the expiration time (24 hours in this example)
    const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    user.sessionToken = sessionToken;
    user.sessionExpires = sessionExpires;

    await user.save();

    res.json({ sessionToken, sessionExpires, message: "User is valid." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





router.get('/validate-session', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, message: "Authorization header missing or invalid." });
    }

    const token = authHeader.split(' ')[1];

    const user = await User.findOne({
      sessionToken: token,
      sessionExpires: { $gte: Date.now() } 
    });

    if (!user) {
      return res.status(401).json({ valid: false });
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/admin-login', async (req, res) => {
  try {
    const { admin, password } = req.body;

    // Check if admin and password are provided
    if (!password || !admin) {
      return res.status(400).json({ message: "Please provide admin and password for login." });
    }

    // Find the admin in the database
    const user = await Admin.findOne({ admin, password });

    // Check if admin exists
    if (user) {
      // Admin is valid
      const token = jwt.sign({ admin: user.admin }, process.env.JWT_SECRET_KEY, { expiresIn: "31d" });
      return res.status(200).json({ message: "Admin is valid.", token });
    } else {
      // Admin is invalid
      return res.status(401).json({ message: "Invalid admin or password." });
    }
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
