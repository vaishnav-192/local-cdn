import express from 'express';
import multer from 'multer';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import WebTorrent from 'webtorrent';
import os from 'os';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const port = process.env.PORT || 4000;
const masterNodeAddress = process.env.MASTER_NODE || 'https://local-cdn-master.vercel.app';
const client = new WebTorrent();

// Serve static files
const app = express();
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', `http://localhost:${port}`);
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Get the local machine's IP address
const getLocalIpAddress = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName of Object.keys(networkInterfaces)) {
        for (const interfaceInfo of networkInterfaces[interfaceName]) {
            if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
                return interfaceInfo.address; // Return the first non-internal IPv4 address found
            }
        }
    }
    return 'anonymous'; // Fallback to localhost if no external IP is found
};

const localIpAddress = getLocalIpAddress();
const userProfile = process.env.USER_PROFILE || `${localIpAddress}:${port}`;

// Ensure upload directory exists
const ensureDir = dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Multer storage configuration for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const contentType = mime.lookup(file.originalname);
        if (!contentType) {
            return cb(new Error('Unable to determine content type'));
        }
        const uploadDir = path.join(process.cwd(), `${port}_uploads`, contentType);
        ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Register server with master node using username or IP address
const registerServer = async () => {
    try {
        await axios.post(`${masterNodeAddress}/registerServer`, {
            serverAddress: `${localIpAddress}:${port}`, // Use IP address and port as serverAddress
            name: process.env.USER_PROFILE || `Server on ${localIpAddress}:${port}`, // Use USER_PROFILE as name or fallback to IP:port
        });
        console.log('Server successfully registered with master node');
    } catch (error) {
        console.error('Error registering server:', error.message);
    }
};

// Endpoint for uploading files
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(process.cwd(), `${port}_uploads`, req.file.mimetype, req.file.originalname);
    client.seed(filePath, torrent => {
        const magnetURI = torrent.magnetURI;

        // Make entry on the master node
        axios.post(`${masterNodeAddress}/addMapping`, {
            contentType: req.file.mimetype,
            fileName: req.file.originalname,
            magnetLink: magnetURI, // Use magnetLink instead of magnetURI for consistency
            serverAddress: userProfile // Use serverAddress (uploadedBy) to identify where the file is uploaded
        }).then(() => {
            res.status(200).send({ magnetLink: magnetURI });
        }).catch(err => {
            console.error('Error adding mapping to master node:', err.message);
            res.status(500).send('Failed to add mapping to master node');
        });
    });
});

// Endpoint to fetch file mappings from the master node
app.get('/fetchFile', async (req, res) => {
    const fileName = req.query.fileName;
    try {
        const response = await axios.get(`${masterNodeAddress}/fetchResults`, { params: { fileName } });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching file mappings:', error.message);
        res.status(500).send('Error fetching file mappings');
    }
});

// Heartbeat function to send regular pings to the master node
const sendHeartbeat = async () => {
    try {
        await axios.post(`${masterNodeAddress}/heartbeat`, {
            serverAddress: `${localIpAddress}:${port}`,
        });
        console.log(`Heartbeat sent to master node from ${localIpAddress}:${port} with name as ${userProfile}`);
    } catch (error) {
        console.error('Error sending heartbeat:', error.message);
    }
};

setInterval(sendHeartbeat, 480000); // Send heartbeat every 8 minutes


// Start server and register it with the master node
app.listen(port, () => {
    console.log(`Server node listening on port ${port}`);
    registerServer();
});
