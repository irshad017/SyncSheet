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
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sheetsync';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

const rowLength = 999;
const columnLength = 27;

// SCHEMAS & MODELS
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
  username: { type: String, required: true, unique: true },
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

    const parts = authHeader.split(' ');
    const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : parts[0];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    let user = null;

    if (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
      user = await User.findById(decoded.userId);
    } else if (decoded.username) {
      user = await User.findOne({ username: decoded.username });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found or session invalid' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Not authorized to access this resource' });
  }
};

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// SIGN-UP
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const existingUser = await User.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username: username.trim(), password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET
    );

    return res.status(200).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser._id, username: newUser.username },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// LOG-IN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, username: user.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
});

// USER DETAILS (EXCEPT PASSWORD)
app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(id).populate({
      path: 'spreadsheet',
      select: 'name date owner collaborators',
      populate: { path: 'owner', select: 'username _id' },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json(userObj);
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// GETTING ALL USERS (FOR COLLABORATOR PICKER)
app.get('/api/emails', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id');
    return res.status(200).json({
      msg: 'Successfully retrieved users',
      data: users,
    });
  } catch (err) {
    console.error('Get emails error:', err);
    return res.status(500).json({
      msg: 'Error fetching users',
      error: err.message,
    });
  }
});

// SHARING SPREADSHEET (ALTERNATIVE ROUTE)
app.post('/api/user/share', async (req, res) => {
  const { sheetId, email } = req.body;
  if (!sheetId || !email) {
    return res.status(400).json({ message: 'sheetId and email are required' });
  }

  try {
    const shareTo = await User.findOne({ username: email });
    if (!shareTo) {
      return res.status(404).json({ message: 'User does not exist in the database' });
    }

    const cell = await Cell.findById(sheetId);
    if (!cell) {
      return res.status(404).json({ message: 'Sheet not found for the given ID' });
    }

    if (!shareTo.spreadsheet.some((id) => id.toString() === sheetId.toString())) {
      shareTo.spreadsheet.push(sheetId);
      await shareTo.save();
    }

    if (!cell.collaborators.some((id) => id.toString() === shareTo._id.toString())) {
      cell.collaborators.push(shareTo._id);
      await cell.save();
    }

    return res.status(200).json({ message: 'Successfully added collaborator' });
  } catch (error) {
    console.error('Error sharing sheet:', error);
    return res.status(500).json({ message: 'Error adding collaborator' });
  }
});

// ADD COLLABORATOR
app.post('/api/add-collaborator', async (req, res) => {
  const { spreadsheetId, collaboratorUsername } = req.body;

  if (!spreadsheetId || !collaboratorUsername) {
    return res.status(400).json({ error: 'Invalid request: spreadsheetId and collaboratorUsername required' });
  }

  if (!mongoose.Types.ObjectId.isValid(spreadsheetId)) {
    return res.status(400).json({ error: 'Invalid spreadsheet ID' });
  }

  try {
    const cell = await Cell.findById(spreadsheetId);
    if (!cell) {
      return res.status(404).json({ error: 'Spreadsheet not found' });
    }

    const user = await User.findOne({ username: collaboratorUsername.trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userIdStr = user._id.toString();
    const sheetIdStr = cell._id.toString();

    if (!cell.collaborators.some((cId) => cId.toString() === userIdStr)) {
      cell.collaborators.push(user._id);
      await cell.save();
    }

    if (!user.spreadsheet.some((sId) => sId.toString() === sheetIdStr)) {
      user.spreadsheet.push(cell._id);
      await user.save();
    }

    return res.status(200).json({ message: 'Collaborator added successfully' });
  } catch (error) {
    console.error('Failed to add collaborator:', error);
    return res.status(500).json({ error: 'Failed to add collaborator' });
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

    const sheetName = name && name.trim() ? name.trim() : 'Untitled Spreadsheet';
    const newCellData = new Cell({ name: sheetName, owner });
    await newCellData.save();

    user.spreadsheet.push(newCellData._id);
    await user.save();

    return res.status(200).json({
      id: newCellData._id,
      _id: newCellData._id,
      name: newCellData.name,
      date: newCellData.date,
    });
  } catch (error) {
    console.error('Create spreadsheet error:', error);
    return res.status(500).json({ error: `Failed to create spreadsheet: ${error.message}` });
  }
});

// GET SPREADSHEET CELLS
app.get('/api/spreadsheet/:id', authUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid spreadsheet ID' });
    }

    const cellData = await Cell.findById(id).populate('owner').populate('collaborators');
    if (!cellData) {
      return res.status(404).json({ error: 'Spreadsheet not found' });
    }

    return res.status(200).json(cellData.cells);
  } catch (error) {
    console.error('Get spreadsheet error:', error);
    return res.status(500).json({ error: 'Failed to retrieve spreadsheet' });
  }
});

// UPDATE SPREADSHEET CELLS VIA HTTP & BROADCAST
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

    // Broadcast update to all WebSocket clients currently viewing this spreadsheet
    wsServer.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.spreadsheetId === id
      ) {
        client.send(JSON.stringify({ type: 'update', id, cells }));
      }
    });

    return res.status(200).json({ message: 'Spreadsheet updated successfully' });
  } catch (error) {
    console.error('Update spreadsheet error:', error);
    return res.status(500).json({ error: 'Failed to update spreadsheet' });
  }
});

// DELETE SPREADSHEET (OR REMOVE FOR COLLABORATOR)
// Rules:
// 1. If requester is the Owner (Creator/Admin): Permanently deletes the sheet for everyone and cleans all user references.
// 2. If requester is a Collaborator: Removes the sheet ONLY from their spreadsheet list and removes them from collaborators; owner and other collaborators keep access.
// 3. Edge Cases: Handles missing/dangling documents, missing tokens, invalid IDs, and notifies active WS clients.
app.delete('/api/spreadsheet/:id', async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid spreadsheet ID' });
  }

  // Extract requester userId from token header or query/body fallback
  let requesterId = req.query.userId || req.body?.userId;

  const authHeader = req.header('Authorization');
  if (authHeader) {
    try {
      const parts = authHeader.split(' ');
      const token = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : parts[0];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.userId) {
          requesterId = decoded.userId;
        } else if (decoded.username) {
          const u = await User.findOne({ username: decoded.username });
          if (u) requesterId = u._id.toString();
        }
      }
    } catch (tokenErr) {
      console.warn('Auth token verify failed in delete, using provided requesterId if available');
    }
  }

  if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
    return res.status(401).json({ error: 'Authentication or valid userId required to delete/remove spreadsheet' });
  }

  try {
    const cell = await Cell.findById(id);

    // EDGE CASE 1: Spreadsheet document does not exist in DB (already deleted or orphaned)
    if (!cell) {
      // Clean up the dangling reference from the requesting user's list anyway
      await User.findByIdAndUpdate(requesterId, {
        $pull: { spreadsheet: id },
      });
      return res.status(200).json({
        message: 'Spreadsheet reference removed from your workspace',
        isOwner: false,
        action: 'removed',
      });
    }

    const isOwner = Boolean(cell.owner && cell.owner.toString() === requesterId.toString());

    // CASE A: Requester IS the Owner (Admin / Creator)
    if (isOwner) {
      // 1. Permanently delete the Cell document
      await Cell.findByIdAndDelete(id);

      // 2. Remove the sheet from all users (owner and collaborators)
      await User.updateMany(
        { spreadsheet: id },
        { $pull: { spreadsheet: id } }
      );

      // 3. Notify any active WebSocket clients viewing this sheet
      wsServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.spreadsheetId === id) {
          client.send(
            JSON.stringify({
              type: 'deleted',
              id,
              message: 'This spreadsheet was permanently deleted by the owner.',
            })
          );
        }
      });

      return res.status(200).json({
        message: 'Spreadsheet deleted permanently for all users',
        isOwner: true,
        action: 'deleted',
      });
    }

    // CASE B: Requester is a Collaborator (NOT the Owner)
    // 1. Remove the sheet ONLY from this collaborator's spreadsheet array
    await User.findByIdAndUpdate(requesterId, {
      $pull: { spreadsheet: id },
    });

    // 2. Remove this user from the Cell document's collaborators array
    await Cell.findByIdAndUpdate(id, {
      $pull: { collaborators: requesterId },
    });

    // The owner and other collaborators keep their access untouched!
    return res.status(200).json({
      message: 'Spreadsheet removed from your workspace',
      isOwner: false,
      action: 'removed',
    });
  } catch (err) {
    console.error('Delete spreadsheet error:', err);
    return res.status(500).json({ error: 'Failed to process spreadsheet deletion' });
  }
});

// LEGACY DELETE ROUTE FOR BACKWARDS COMPATIBILITY
app.get('/delete/:userDel', async (req, res) => {
  const { sheetId } = req.query;
  const { userDel } = req.params;

  if (!sheetId || !mongoose.Types.ObjectId.isValid(sheetId)) {
    return res.status(400).json({ msg: 'Valid sheetId query parameter is required' });
  }

  if (!userDel || !mongoose.Types.ObjectId.isValid(userDel)) {
    return res.status(400).json({ msg: 'Valid userDel parameter is required' });
  }

  try {
    const cell = await Cell.findById(sheetId);
    if (!cell) {
      await User.findByIdAndUpdate(userDel, { $pull: { spreadsheet: sheetId } });
      return res.status(200).json({ message: 'Spreadsheet reference removed' });
    }

    const isOwner = Boolean(cell.owner && cell.owner.toString() === userDel.toString());
    if (isOwner) {
      await User.updateMany(
        { spreadsheet: sheetId },
        { $pull: { spreadsheet: sheetId } }
      );
      await Cell.findByIdAndDelete(sheetId);
      return res.status(200).json({ message: 'Spreadsheet deleted permanently' });
    } else {
      await User.findByIdAndUpdate(userDel, { $pull: { spreadsheet: sheetId } });
      await Cell.findByIdAndUpdate(sheetId, { $pull: { collaborators: userDel } });
      return res.status(200).json({ message: 'Spreadsheet removed from your workspace' });
    }
  } catch (err) {
    console.error('Legacy delete error:', err);
    return res.status(500).json({ msg: 'Not deleted' });
  }
});

// HTTP & WEBSOCKET SERVER
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
    console.error('Error parsing WS connection URL:', err);
  }

  // Handle incoming messages
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

            // Broadcast only to clients viewing the same spreadsheet
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
      console.error('Error processing WebSocket message:', parseError);
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
              cells: cellData && cellData.cells ? cellData.cells : [],
            })
          );
        }
      })
      .catch((error) => {
        console.error('Error initializing WebSocket data:', error);
      });
  }

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});