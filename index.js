const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
// const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const State = require('./models/state');

const app = express();
const PORT = process.env.PORT || 3000;

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
// app.use(helmet()); // Adds security headers
app.use(bodyParser({limit: '50mb'}));
app.use(express.static(path.join(__dirname, 'public'))); // Serves static files

// Rate limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per windowMs
//     message: 'Too many requests, please try again later.'
// });

// app.use(limiter);

// Serve the main HTML file
// app.get('/', (req, res) => {

//     // if id is set, 
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

//pass in an optional id
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/art/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to save state
app.post('/state', async (req, res) => {
    const state = req.body;

    // Validate state here (e.g., schema validation)
    try {
        const newState = new State();
        newState.pegs = state;
        await newState.save();
        res.status(200).json({ id: newState._id });
    } catch (error) {
        console.error('Error saving state:', error);
        res.status(500).json({ message: 'Failed to save state' });
    }
});

// get by id:
app.get('/state/:id', async (req, res) => {
    try {
        const state = await State.findById(req.params.id).lean();
        res.status(200).json(state);
    } catch (error) {
        console.error('Error getting state:', error);
        res.status(500).json({ message: 'Failed to get state' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
