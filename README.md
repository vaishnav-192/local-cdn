# Local CDN Server

This is the server node for the Local CDN project. It interacts with the master node to manage and share files using WebTorrent, while maintaining regular communication via heartbeats.

## Features

- **File Uploads:** The server accepts file uploads and seeds them using WebTorrent.
- **File Mapping Registration:** Once uploaded, the server registers the file's details, including its magnet link, on the master node for future retrieval.
- **Heartbeat Mechanism:** The server regularly sends heartbeats to the master node to indicate its liveliness.
- **Fetching Files:** The server can fetch file mappings from the master node using the file name.

## Project Structure

- `server.js`: The main Express server handling file uploads, heartbeats, and communication with the master node.
- `uploads/`: Directory where files are stored before being seeded with WebTorrent.

## Environment Variables

- `PORT`: The port on which the server will run. Defaults to `4000`.
- `MASTER_NODE`: The address of the master node. Defaults to `https://local-cdn-master.vercel.app`.
- `USER_PROFILE`: A custom name or identifier for the server. Defaults to the local IP address and port.

## API Endpoints

### Upload a File

- **Endpoint:** `/upload`
- **Method:** `POST`
- **Description:** Uploads a file to the server and registers it with the master node.
- **Form Data:**
  - `file`: The file to upload.

Example:
```bash
curl -F "file=@example.mp4" http://localhost:4000/upload
```

### Heartbeat Mechanism
The server sends a heartbeat to the master node every 8 minutes to indicate its active status.

### WebTorrent Configuration
The server uses WebTorrent to seed uploaded files and generate magnet links. The files are seeded automatically once uploaded, allowing for distributed sharing.

### How to get started

1. Clone the repository.
2. Install dependencies
```bash
npm install
```
3. Create a `.env` file to configure the environment variables
```bash
PORT=4000
MASTER_NODE=https://local-cdn-master.vercel.app
USER_PROFILE=MyServer
```
4. Start the server
```bash
npm start
```
5. Go to `http://localhost:{PORT}` for user frontend/UI

















