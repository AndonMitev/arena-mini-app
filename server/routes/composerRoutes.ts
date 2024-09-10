import express from 'express';
import { Request, Response } from 'express';
import {
  ComposerActionFormResponse,
  ComposerActionMetadata
} from '../types/composerTypes';

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
  const data = req.body;
  console.log(data);
  res.json({
    type: 'form',
    title: 'Action Composer Mini App',
    url: 'https://97ec-89-215-8-152.ngrok-free.app' // make sure this is your public URL
  } as ComposerActionFormResponse);
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
