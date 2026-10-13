require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { WebSocketServer } = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/sheetsync';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

const rowLength = 999;
const columnLength = 27;

const cellSchema = new mongoose.Schema({
  name: { type: String, default: 'Untitled Spreadsheet' },
  date: {
    type: Date,
    default: Date.now,
  },
  cells: {
    type: [[String]],
    default: () => Array.from({ length: rowLength }, () => Array(columnLength).fill('')),
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const Cell = mongoose.model('Cell', cellSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  spreadsheet: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cell' }],
});

const User = mongoose.model('User', userSchema);

// AUTH MIDDLEWARE
const authUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    // Handles single "Bearer <token>", repeated "Bearer Bearer <token>", or raw token
    const parts = authHeader.trim().split(/\s+/);
    const token = parts[parts.length - 1];

    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    const data = jwt.verify(token, JWT_SECRET);
    const userQuery = data.userId
      ? { _id: data.userId }
      : { username: data.username };

    const user = await User.findOne(userQuery).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found or token invalid' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Not authorized to access this resource' });
  }
};

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// SIGN-UP
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username: normalizedUsername, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, username: newUser.username },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// LOG-IN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { username: user.username, userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// GET USER DETAILS
app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('spreadsheet');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Retrieve user error:', error);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// GET EMAILS / COLLABORATORS LIST (SECURE - NO PASSWORD LEAKS)
app.get('/api/emails', async (req, res) => {
  try {
    const users = await User.find().select('username _id');
    res.status(200).json({
      msg: 'Successfully fetched emails',
      data: users,
    });
  } catch (err) {
    console.error('Fetch emails error:', err);
    res.status(500).json({ msg: 'Error', err: err.message });
  }
});

// ADD COLLABORATOR (PRIMARY ENDPOINT)
app.post('/api/add-collaborator', async (req, res) => {
  const { spreadsheetId, collaboratorUsername } = req.body;

  if (!spreadsheetId || !collaboratorUsername) {
    return res.status(400).json({ error: 'spreadsheetId and collaboratorUsername are required' });
  }

  if (!mongoose.Types.ObjectId.isValid(spreadsheetId)) {
    return res.status(400).json({ error: 'Invalid spreadsheet ID' });
  }

  try {
    const cell = await Cell.findById(spreadsheetId);
    if (!cell) {
      return res.status(404).json({ error: 'Spreadsheet not found' });
    }

    const normalizedTarget = collaboratorUsername.trim().toLowerCase();
    const user = await User.findOne({ username: normalizedTarget });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Atomic update avoids requiring replica sets
    await Cell.findByIdAndUpdate(spreadsheetId, {
      $addToSet: { collaborators: user._id },
    });

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { spreadsheet: spreadsheetId },
    });

    res.status(200).json({ message: 'Collaborator added successfully' });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

// SHARING-SHEET (LEGACY / ALIAS ENDPOINT FOR BACKWARDS COMPATIBILITY)
app.post('/api/user/share', async (req, res) => {
  const { sheetId, email, spreadsheetId, collaboratorUsername } = req.body;
  const targetSheetId = sheetId || spreadsheetId;
  const targetEmail = email || collaboratorUsername;

  if (!targetSheetId || !targetEmail) {
    return res.status(400).json({ message: 'Missing sheetId or email' });
  }

  if (!mongoose.Types.ObjectId.isValid(targetSheetId)) {
    return res.status(400).json({ message: 'Invalid sheet ID' });
  }

  try {
    const normalizedEmail = targetEmail.trim().toLowerCase();
    const shareTo = await User.findOne({ username: normalizedEmail });
    if (!shareTo) {
      return res.status(404).json({ message: 'Email does not exist in the database' });
    }

    const cell = await Cell.findById(targetSheetId);
    if (!cell) {
      return res.status(404).json({ message: 'Sheet not found for the given ID' });
    }

    await Cell.findByIdAndUpdate(targetSheetId, {
      $addToSet: { collaborators: shareTo._id },
    });

    await User.findByIdAndUpdate(shareTo._id, {
      $addToSet: { spreadsheet: targetSheetId },
    });

    res.status(200).json({ message: 'Successfully added collaborator' });
  } catch (error) {
    console.error('Error sharing sheet:', error);
    res.status(500).json({ message: 'Error adding collaborator' });
  }
});

// CREATE SPREADSHEET
app.post('/api/spreadsheet', async (req, res) => {
  try {
    const { name, owner } = req.body;
    if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: 'Valid owner ID is required' });
    }

    const user = await User.findById(owner);
    if (!user) {
      return res.status(404).json({ error: 'Owner user not found' });
    }

    const newCellData = new Cell({
      name: name && name.trim() ? name.trim() : 'Untitled Spreadsheet',
      owner,
    });

    await newCellData.save();

    await User.findByIdAndUpdate(owner, {
      $addToSet: { spreadsheet: newCellData._id },
    });

    res.status(200).json({ id: newCellData._id, name: newCellData.name });
  } catch (error) {
    console.error('Create spreadsheet error:', error);
    res.status(500).json({ error: `Failed to create spreadsheet: ${error.message}` });
  }
});

// GET SPREADSHEET BY ID
app.get('/api/spreadsheet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid spreadsheet ID' });
    }

    const cellData = await Cell.findById(id)
      .populate('owner', 'username')
      .populate('collaborators', 'username');

    if (!cellData) {
      return res.status(404).json({ error: 'Spreadsheet not found' });
    }

    res.json(cellData.cells);
  } catch (error) {
    console.error('Retrieve spreadsheet error:', error);
    res.status(500).json({ error: 'Failed to retrieve spreadsheet' });
  }
});

// UPDATE SPREADSHEET BY ID (HTTP PUT/POST)
app.post('/api/spreadsheet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid spreadsheet ID' });
    }

    const { cells } = req.body;
    if (!cells || !Array.isArray(cells)) {
      return res.status(400).json({ error: 'Cells array is required' });
    }

    const updated = await Cell.findByIdAndUpdate(id, { cells }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Spreadsheet not found' });
    }

    // Broadcast update to all connected WebSocket clients viewing this spreadsheet
    wsServer.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.spreadsheetId === id
      ) {
        client.send(JSON.stringify({ type: 'update', id, cells }));
      }
    });

    res.status(200).json({ message: 'Spreadsheet updated successfully' });
  } catch (error) {
    console.error('Update spreadsheet error:', error);
    return res.status(500).json({ error: 'Failed to update spreadsheet' });
  }
});

// DELETE SPREADSHEET (RESTFUL ROUTE)
app.delete('/api/spreadsheet/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid spreadsheet ID' });
  }

  try {
    const cell = await Cell.findById(id);
    if (!cell) {
      return res.status(404).json({ error: 'Spreadsheet not found' });
    }

    // Remove from owner and all collaborators
    await User.updateMany(
      { spreadsheet: id },
      { $pull: { spreadsheet: id } }
    );

    // Delete cell document
    await Cell.findByIdAndDelete(id);

    res.status(200).json({ message: 'Spreadsheet deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete spreadsheet' });
  }
});

// LEGACY DELETE ROUTE FOR COMPATIBILITY
app.get('/delete/:userDel', async (req, res) => {
  const { sheetId } = req.query;
  const { userDel } = req.params;

  if (!sheetId || !mongoose.Types.ObjectId.isValid(sheetId)) {
    return res.status(400).json({ msg: 'Valid sheetId query param required' });
  }

  try {
    // Remove sheet from all users
    await User.updateMany(
      { spreadsheet: sheetId },
      { $pull: { spreadsheet: sheetId } }
    );

    await Cell.findByIdAndDelete(sheetId);

    res.status(200).json({ message: 'Sheet deleted successfully' });
  } catch (err) {
    console.error('Legacy delete error:', err);
    res.status(500).json({ msg: 'Not deleted' });
  }
});

// WEBSOCKET & HTTP SERVER
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

wsServer.on('connection', (ws, req) => {
  let spreadsheetId = null;
  let clientId = null;

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    spreadsheetId = url.searchParams.get('spreadsheetId');
    clientId = url.searchParams.get('clientId');
    ws.spreadsheetId = spreadsheetId;
    ws.clientId = clientId;
  } catch (err) {
    console.error('Error parsing WS URL:', err);
  }

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { type, row, col, value } = data;

      if (type === 'update' && spreadsheetId) {
        if (
          typeof row === 'number' &&
          typeof col === 'number' &&
          row >= 0 &&
          row < rowLength &&
          col >= 0 &&
          col < columnLength
        ) {
          const cellData = await Cell.findById(spreadsheetId);
          if (cellData && cellData.cells && cellData.cells[row]) {
            cellData.cells[row][col] = value !== undefined ? String(value) : '';
            cellData.markModified('cells');
            await cellData.save();

            // Broadcast only to clients viewing the SAME spreadsheet
            wsServer.clients.forEach((client) => {
              if (
                client !== ws &&
                client.readyState === WebSocket.OPEN &&
                client.spreadsheetId === spreadsheetId
              ) {
                client.send(
                  JSON.stringify({
                    type: 'update',
                    id: spreadsheetId,
                    cells: cellData.cells,
                  })
                );
              }
            });
          }
        }
      } else if (type === 'select' && spreadsheetId) {
        const selectedCell = { row, col };
        wsServer.clients.forEach((client) => {
          if (
            client !== ws &&
            client.readyState === WebSocket.OPEN &&
            client.spreadsheetId === spreadsheetId
          ) {
            client.send(
              JSON.stringify({
                type: 'select',
                id: spreadsheetId,
                selectedCell,
                clientId: ws.clientId,
              })
            );
          }
        });
      }
    } catch (parseError) {
      console.error('Error handling WebSocket message:', parseError);
    }
  });

  // Send initial data to connected client
  if (spreadsheetId && mongoose.Types.ObjectId.isValid(spreadsheetId)) {
    Cell.findById(spreadsheetId)
      .then((cellData) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'init',
              id: spreadsheetId,
              cells: cellData ? cellData.cells : [],
            })
          );
        }
      })
      .catch((error) => {
        console.error('Error initializing WebSocket client data:', error);
      });
  }

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});