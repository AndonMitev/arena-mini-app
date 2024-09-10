import express from 'express';
import { Request, Response } from 'express';
import {
  ComposerActionFormResponse,
  ComposerActionMetadata
} from '../types/composerTypes';
import { getIO, userSessions } from '../socket';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
  const data = req.body;
  const fid = data.untrustedData.fid;

  // Create or update the session for this FID
  if (!userSessions[fid]) {
    userSessions[fid] = { sessionId: uuidv4(), data: {}, socket: null };
  }
  userSessions[fid].data = { ...userSessions[fid].data, ...data };

  // Get the io instance
  const io = getIO();

  // Emit data to the specific user's room
  io.to(`user_${fid}`).emit('userData', {
    sessionId: userSessions[fid].sessionId,
    data: userSessions[fid].data
  });
  console.log(
    `Data emitted for FID ${fid}, SessionID: ${userSessions[fid].sessionId}`
  );

  res.json({
    type: 'form',
    title: 'Action Composer Mini App',
    url: 'https://arena-mini-app.vercel.app'
  } as ComposerActionFormResponse);
});

router.get('/user-data', (req: Request, res: Response) => {
  const fid = Number(req.query.fid);
  if (fid && userSessions[fid]) {
    res.json(userSessions[fid]);
  } else {
    res.status(404).json({ error: 'User data not found for this FID' });
  }
});

router.get('/', (req: Request, res: Response) => {
  res.json({
    type: 'composer',
    name: 'Mini App',
    icon: 'checkbox',
    description: 'Create a poll frame',
    aboutUrl: 'https://your-app-server.example.com/about',
    imageUrl: 'https://your-app-server.example.com/static/logo.png',
    action: {
      type: 'post'
    }
  } as ComposerActionMetadata);
});

export default router;
