// index.js

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({origin:"*"}));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Middleware
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
