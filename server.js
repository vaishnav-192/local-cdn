const express = require('express');
const app = express();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
require('dotenv').config();


const port = process.env.PORT || 4000; // Use PORT environment variable or default to 4000
const serverAddress = `http://localhost:${port}`;
const masterNodeAddress = 'https://local-cdn-master.vercel.app'; // Replace with the actual master node address

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', `http://localhost:${port}`);
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Ensure upload directory structure
const ensureDir = dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const contentType = mime.lookup(file.originalname);
        if (!contentType) {
            return cb(new Error('Unable to determine content type'));
        }
        const uploadDir = path.join(__dirname, `${port}_uploads`, contentType);
        ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Register this server with the master node
const registerServer = async () => {
    try {
        console.log(`Attempting to register server: ${serverAddress}`); // Log the attempt
        await axios.post(`${masterNodeAddress}/registerServer`, {
            serverAddress,
            name: `Server on port ${port}`,
        });
        console.log(`Server successfully registered with master node`);
    } catch (error) {
        console.error('Error registering server:', error.message); // Log error details
    }
};

// Endpoint to upload a file
app.post('/upload', upload.single('file'), async (req, res) => {
    const fileName = req.file.originalname;
    const contentType = mime.lookup(fileName);
    if (!contentType || !fileName) {
        return res.status(400).send('ContentType and file are required');
    }
    try {
        await axios.post(`${masterNodeAddress}/addMapping`, { contentType, fileName, server: `${serverAddress}/giveFile?contentType=${contentType}&fileName=${fileName}` });
        res.sendStatus(200);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file');
    }
});

// Updated endpoint to fetch file info
app.get('/fetchFile', async (req, res) => {
    const { fileName } = req.query;
    if (!fileName) {
        return res.status(400).send('FileName is required');
    }

    try {
        // Fetch results from master server
        const response = await axios.get(`${masterNodeAddress}/fetchResults`, { params: { fileName } });
        const results = response.data;

        // Send results as JSON
        res.json(results);
    } catch (error) {
        console.error('Error fetching file info from master server:', error);
        res.status(500).send('Error fetching file info');
    }
});

// Endpoint to download a file
app.get('/giveFile', (req, res) => {
    const { contentType, fileName } = req.query;
    if (!contentType || !fileName) {
        return res.status(400).send('ContentType and fileName are required');
    }

    const filePath = path.join(__dirname, `${port}_uploads`, contentType, fileName);
    if (fs.existsSync(filePath)) {
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error downloading file');
            }
        });
    } else {
        res.status(404).send('File not found');
    }
});

// Start the server and register it with the master node
app.listen(port, () => {
    console.log(`Server node listening on port ${port}`);
    registerServer();
});
