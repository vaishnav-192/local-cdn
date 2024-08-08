const express = require('express');
const app = express();
app.use(express.json());

const servers = [];
const mappings = {}; // Replace this with a proper database

// Endpoint to register a server
app.post('/registerServer', (req, res) => {
    const { serverAddress, name, port } = req.body;
    if (!servers.some(server => server.serverAddress === serverAddress)) {
        servers.push({ serverAddress, name, port });
    }
    res.sendStatus(200);
});

// Endpoint to add file mapping
app.post('/addMapping', (req, res) => {
    const { contentType, fileName, server } = req.body;
    if (!mappings[contentType]) {
        mappings[contentType] = {};
    }
    mappings[contentType][fileName] = server;
    res.sendStatus(200);
});

// Fetch matching files endpoint
app.get('/fetchResults', (req, res) => {
    const { fileName } = req.query;
    if (!fileName) {
        return res.status(400).send('FileName query parameter is required');
    }

    const results = [];
    const fileNameRegex = new RegExp(fileName, 'i');

    for (const [contentType, files] of Object.entries(mappings)) {
        for (const [mappedFileName, server] of Object.entries(files)) {
            if (fileNameRegex.test(mappedFileName)) {
                results.push({ contentType, fileName: mappedFileName, server });
            }
        }
    }

    if (results.length === 0) {
        return res.status(404).json({ message: 'No matching files found' });
    }

    res.json(results);
});


// Endpoint to fetch file
app.get('/getFile', (req, res) => {
    const { contentType, fileName } = req.query;
    const server = mappings[contentType]?.[fileName];
    if (server) {
        res.redirect(`${server}/fetchFile?fileName=${fileName}`);
    } else {
        res.sendStatus(404);
    }
});

// Endpoint to get all registered servers
app.get('/servers', (req, res) => {
    res.json(servers);
});

app.get('/mappings', (req, res) => {
    res.json(mappings);
});

app.listen(3000, () => {
    console.log('Master node listening on port 3000');
});
