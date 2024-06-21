const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
// const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
require('dotenv').config();

const State = require('./models/state');
const Preview = require('./models/preview');

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

const injectMetaTags = (req, res, next) => {
    let url = 'https://britepegs.com/api/preview/' + req.params.id;
    const metaTags = `
     <meta property="og:image" content="${url}">
     <meta property="twitter:image:">
    `

    req.metaTags = metaTags;
    next();
};

// Middleware
app.use(bodyParser.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, 'app/build'))); // Serves static files

// Rate limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per windowMs
//     message: 'Too many requests, please try again later.'
// });

// app.use(limiter);

// API Routes
app.post('/api/state', async (req, res) => {
    const pegs = req.body.pegs;
    const base64Image = req.body.base64Image; 
    try {
        const state = new State();
        state.pegs = pegs;
        await state.save();

        const preview = new Preview();
        preview.base64Image = base64Image;
        preview.stateId = state._id;
        await preview.save();
        // Save the art ID in the session
        req.session.artId = state._id;
        res.status(200).json({ id: state._id });

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

app.get('/api/preview/:id', async (req, res) => {
    try {
        const preview = await Preview.findOne({ stateId: req.params.id }).lean();
        
        if (!preview) {
            return res.status(404).json({ message: 'Preview not found' });
        }

        const base64Data = preview.base64Image.replace(/^data:image\/png;base64,/, "");
        const file = Buffer.from(base64Data, 'base64');

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': file.length,
            // should be used in html img tag:
            "Cache-Control": "public, max-age=31536000",
            "Expires": new Date(Date.now() + 31536000000).toUTCString()
            // 'Content-Disposition': `attachment; filename="britepegs-${req.params.id}.png"`
        });
        res.end(file);

    } catch (error) {
        console.error('Error getting preview:', error);
        res.status(500).json({ message: 'Failed to get preview' });
    }
});

// Serve the main HTML file for the React app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app/build', 'index.html'));
});

app.get('/art/:id', injectMetaTags, (req, res) => {
    const htmlFile = path.join(__dirname, 'app/build', 'index.html');
    fs.readFile(htmlFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading HTML file');
        }

        const updatedHtml = data.replace('</head>', `${req.metaTags}</head>`);

        res.send(updatedHtml);
    });
});

// Allowed file extensions
const allowedExtensions = [
    '.html', '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.json', '.txt', '.ico'
];

// Catch-all route to serve static files
app.get('*', (req, res) => {
    const requestedPath = path.join(__dirname, 'app/assets', req.path);
    const extname = path.extname(requestedPath).toLowerCase();

    if (allowedExtensions.includes(extname)) {
        fs.access(requestedPath, fs.constants.F_OK, (err) => {
            if (err) {
                // If the file doesn't exist, send 404
                res.status(404).send('File not found');
            } else {
                // If the file exists, serve the file
                res.sendFile(requestedPath);
            }
        });
    } else {
        // If the extension is not allowed, send 404
        res.status(404).send('File not found');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
