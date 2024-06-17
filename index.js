const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
require('dotenv').config();

const State = require('./models/state');

const app = express();
const PORT = process.env.PORT || 3000;

//init session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'app/build'))); // Serves static files

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.'
});

app.use(limiter);

// API Routes
app.post('/api/state', async (req, res) => {
    const state = req.body;
    try {
        const newState = new State();
        newState.pegs = state;
        await newState.save();
        // Save the art ID in the session
        req.session.artId = newState._id;
        res.status(200).json({ id: newState._id });
    } catch (error) {
        console.error('Error saving state:', error);
        res.status(500).json({ message: 'Failed to save state' });
    }
});

app.get('/api/state/:id', async (req, res) => {
    try {
        const state = await State.findById(req.params.id).lean();
        res.status(200).json(state);
    } catch (error) {
        console.error('Error getting state:', error);
        res.status(500).json({ message: 'Failed to get state' });
    }
});

// for last saved session:
app.get('/api/session', (req, res) => {
    res.json({ artId: req.session.artId });
});

// Serve the main HTML file for the React app
app.get('/art/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/build', 'index.html'));
});

// Allowed file extensions
const allowedExtensions = [
    '.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.json', '.txt', '.ico'
];

// Catch-all route to serve React's index.html for other routes
app.get('*', (req, res) => {
    const requestedPath = path.join(__dirname, 'app/assets', req.path);
    const extname = path.extname(requestedPath).toLowerCase();

    if (allowedExtensions.includes(extname)) {
        fs.access(requestedPath, fs.constants.F_OK, (err) => {
            if (err) {
                // If the file doesn't exist, serve 'index.html'
                res.sendFile(path.join(__dirname, 'app/build', 'index.html'));
            } else {
                // If the file exists, serve the file
                res.sendFile(requestedPath);
            }
        });
    } else {
        // If the extension is not allowed, serve 'index.html'
        res.sendFile(path.join(__dirname, 'app/build', 'index.html'));
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
