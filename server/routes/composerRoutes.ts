import express from 'express';
import { Request, Response } from 'express';
import {
  ComposerActionFormResponse,
  ComposerActionMetadata
} from '../types/composerTypes';
import { getIO, userSessions } from '../socket';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const MOCKED_DATA = {
  untrustedData: {
    fid: 499205,
    url: 'https://0ae7-89-215-8-152.ngrok-free.app/api/composer',
    messageHash: '0xcf70b757883d877a8625fce4506cf2d0e2fd7c54',
    timestamp: 1726135434000,
    network: 1,
    buttonIndex: 1,
    state:
      '%7B%22requestId%22%3A%22f39efb85-b970-4c92-9bd2-9fdf7fc08151%22%2C%22cast%22%3A%7B%22text%22%3A%22dsadsa%22%2C%22embeds%22%3A%5B%5D%2C%22castDistribution%22%3A%22default%22%7D%7D',
    castId: { fid: 9152, hash: '0x0000000000000000000000000000000000000000' }
  },
  trustedData: {
    messageBytes:
      '0a9a02080d1085bc1e188aadd1372001820189020a3568747470733a2f2f306165372d38392d3231352d382d3135322e6e67726f6b2d667265652e6170702f6170692f636f6d706f73657210011a1908c047121400000000000000000000000000000000000000002ab20125374225323272657175657374496425323225334125323266333965666238352d623937302d346339322d396264322d3966646637666330383135312532322532432532326361737425323225334125374225323274657874253232253341253232647361647361253232253243253232656d6265647325323225334125354225354425324325323263617374446973747269627574696f6e25323225334125323264656661756c742532322537442537441214cf70b757883d877a8625fce4506cf2d0e2fd7c54180122400f2dc38307cdd577d7756deb9b1eba3651710ee362857a7ee418dbd3394762a9ee515bfc46eead8bdd6db216b5e0c559c68768c2577824495b7ed35e9b87f807280132201831e080da70261d5e2a64fda996db7c95ddf8996581e886ceef7266552a3778'
  }
};

router.post('/', (req: Request, res: Response) => {
  const data =
    req.body && Object.keys(req.body).length > 0 ? req.body : MOCKED_DATA;
  const fid = data.untrustedData.fid;
  const sessionId = req.headers['x-session-id'] as string;

  console.log(`Received POST request for FID: ${fid}, Session: ${sessionId}`);
  console.log('Active sessions:', Object.keys(userSessions));

  if (!sessionId || !userSessions[sessionId]) {
    console.log(`No session found for SessionID: ${sessionId}`);
    return res.status(400).json({ error: 'No active session found' });
  }

  userSessions[sessionId].fid = fid;
  userSessions[sessionId].data = { ...userSessions[sessionId].data, ...data };

  const io = getIO();
  console.log(`Attempting to emit userData to session ${sessionId}`);
  userSessions[sessionId].socket.emit('userData', {
    sessionId,
    fid,
    data: userSessions[sessionId].data
  });

  console.log(`Data emitted for FID ${fid}, SessionID: ${sessionId}`);

  res.json({
    type: 'form',
    title: 'Action Composer Mini App',
    url: 'https://your-client-url.com' // Update this with your actual client URL
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
    icon: 'check',
    description: 'Create a poll frame',
    aboutUrl: 'https://your-app-server.example.com/about',
    imageUrl: 'https://your-app-server.example.com/static/logo.png',
    action: {
      type: 'post'
    }
  } as ComposerActionMetadata);
});

export default router;
