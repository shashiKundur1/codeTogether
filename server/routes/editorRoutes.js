import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { saveRoom, getCodeSnapshot, getRoomUsers } from '../database/sqlite.js';

const router = express.Router();

// Create a new room
router.post('/rooms', async (req, res) => {
  try {
    const roomId = uuidv4();
    const { name = 'Untitled Room' } = req.body;
    
    await saveRoom(roomId, name);
    
    res.json({ 
      success: true, 
      roomId,
      url: `/editor/${roomId}`
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create room' 
    });
  }
});

// Get room information
router.get('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const snapshot = await getCodeSnapshot(roomId);
    const users = await getRoomUsers(roomId);
    
    res.json({
      success: true,
      room: {
        id: roomId,
        code: snapshot?.content || '',
        language: snapshot?.language || 'javascript',
        users: users.length
      }
    });
  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get room information' 
    });
  }
});

export default router;