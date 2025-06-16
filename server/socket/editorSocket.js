import { 
  saveRoom, 
  saveCodeSnapshot, 
  getCodeSnapshot, 
  addUser, 
  removeUser, 
  updateUserCursor, 
  getRoomUsers 
} from '../database/sqlite.js';

const generateUserColor = () => {
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#10b981', '#f59e0b', '#84cc16', '#06b6d4'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const rooms = new Map(); // Store active rooms and their users

export const handleSocketConnection = (socket, io) => {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on('join-room', async (data) => {
    try {
      const { roomId, username } = data;
      const userColor = generateUserColor();
      
      // Join socket room
      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;
      socket.userColor = userColor;

      // Save room and user to database
      await saveRoom(roomId);
      await addUser(username, roomId, userColor);

      // Add to active rooms tracking
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add({ username, color: userColor, socketId: socket.id });

      // Get existing code for the room
      const snapshot = await getCodeSnapshot(roomId);
      const roomUsers = await getRoomUsers(roomId);

      // Send current code to the new user
      socket.emit('sync-code', {
        code: snapshot?.content || '// Welcome to CodeTogether!\n// Start typing to collaborate in real-time\n\nconsole.log("Hello, World!");',
        language: snapshot?.language || 'javascript'
      });

      // Notify all users in the room about the new user
      socket.to(roomId).emit('user-joined', {
        username,
        color: userColor,
        users: roomUsers
      });

      // Send current users list to the new user
      socket.emit('users-list', { users: roomUsers });

      console.log(`✅ ${username} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('code-change', async (data) => {
    try {
      const { code, language = 'javascript' } = data;
      const roomId = socket.roomId;

      if (roomId) {
        // Broadcast code change to all other users in the room
        socket.to(roomId).emit('code-update', { code, language });

        // Save code snapshot (debounced in real implementation)
        await saveCodeSnapshot(roomId, code, language);
      }
    } catch (error) {
      console.error('Error handling code change:', error);
    }
  });

  socket.on('cursor-move', async (data) => {
    try {
      const { line, column } = data;
      const roomId = socket.roomId;
      const username = socket.username;

      if (roomId && username) {
        // Update cursor position in database
        await updateUserCursor(username, roomId, line, column);

        // Broadcast cursor position to other users
        socket.to(roomId).emit('cursor-update', {
          username,
          line,
          column,
          color: socket.userColor
        });
      }
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  });

  socket.on('language-change', async (data) => {
    try {
      const { language } = data;
      const roomId = socket.roomId;

      if (roomId) {
        // Broadcast language change to all users in the room
        socket.to(roomId).emit('language-update', { language });
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const roomId = socket.roomId;
      const username = socket.username;

      if (roomId && username) {
        // Remove user from database
        await removeUser(username, roomId);

        // Remove from active rooms tracking
        if (rooms.has(roomId)) {
          const roomUsers = rooms.get(roomId);
          roomUsers.forEach(user => {
            if (user.socketId === socket.id) {
              roomUsers.delete(user);
            }
          });
          
          if (roomUsers.size === 0) {
            rooms.delete(roomId);
          }
        }

        // Notify other users about disconnection
        socket.to(roomId).emit('user-left', { username });

        console.log(`❌ ${username} left room ${roomId}`);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }

    console.log(`👤 User disconnected: ${socket.id}`);
  });
};