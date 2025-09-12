const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000; // You can change this port if needed

app.use(cors()); // Allow cross-origin requests from your React app
app.use(express.json()); // Parse JSON body in POST requests

const roomsFile = path.join(__dirname, 'src', 'database', 'rooms.json'); // Adjust paths if needed
const accountsFile = path.join(__dirname, 'src', 'database', 'accounts.json');
console.log("Rooms files", roomsFile);

// POST /api/rooms/:roomName/messages
app.post('/api/rooms/:roomName/messages', (req, res) => {
  const roomName = req.params.roomName;
  const newMessage = req.body;

  // Load current rooms.json
  fs.readFile(roomsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read rooms.json' });

    let roomsData;
    try {
      roomsData = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse JSON data' });
    }

    const room = roomsData.rooms.find(r => r.name === roomName);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Add the new message
    room.messages.push(newMessage);

    // Save updated JSON back to file
    fs.writeFile(roomsFile, JSON.stringify(roomsData, null, 2), (writeErr) => {
      if (writeErr) return res.status(500).json({ error: 'Failed to write to rooms.json' });

      res.json({ success: true, message: 'Message added' });
    });
  });
});

// POST /api/rooms
// Body example: { name: "New Room Name" }
app.post('/api/rooms', (req, res) => {
  const newRoomName = req.body.name;

  if (!newRoomName || typeof newRoomName !== 'string') {
    return res.status(400).json({ error: 'Room name is required and should be a string.' });
  }

  fs.readFile(roomsFile, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read rooms.json' });

    let roomsData;
    try {
      roomsData = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse JSON data' });
    }

    // Check if room already exists (case-insensitive)
    const exists = roomsData.rooms.some(
      room => room.name.toLowerCase() === newRoomName.toLowerCase()
    );

    if (exists) {
      return res.status(409).json({ error: 'Room name already exists.' });
    }

    // Add new room with empty messages array
    roomsData.rooms.push({
      name: newRoomName,
      messages: []
    });

    fs.writeFile(roomsFile, JSON.stringify(roomsData, null, 2), (writeErr) => {
      if (writeErr) return res.status(500).json({ error: 'Failed to write to rooms.json' });

      res.status(201).json({ success: true, message: `Room '${newRoomName}' created.` });
    });
  });
});

app.post("/api/accounts", (req, res) => {
  const newAccount = req.body;

  if (!newAccount.username || typeof newAccount.username !== 'string') {
    return res.status(400).json({ error: 'Username is required and should be a string.' });
  }

  fs.readFile(accountsFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading accounts.json:', err);
      return res.status(500).json({ error: 'Failed to read accounts file.' });
    }

    let accountsArray;
    try {
      accountsArray = JSON.parse(data);
      if (!Array.isArray(accountsArray)) {
        throw new Error('accounts.json content is not an array');
      }
    } catch (parseErr) {
      console.error('Error parsing accounts.json:', parseErr);
      return res.status(500).json({ error: 'Failed to parse accounts data.' });
    }

    // Check if username already exists (case insensitive)
    const exists = accountsArray.some(
      acc => acc.username.toLowerCase() === newAccount.username.toLowerCase()
    );

    if (exists) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    // Add the new account
    accountsArray.push(newAccount);

    // Write back updated array to file
    fs.writeFile(accountsFile, JSON.stringify(accountsArray, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing accounts.json:', writeErr);
        return res.status(500).json({ error: 'Failed to save account.' });
      }

      res.status(201).json({ success: true, message: `Account '${newAccount.username}' created.` });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
