import { Request, Response } from 'express';
import { getIceServers } from '../services/webrtc.service';

export const getIceServersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const iceServers = await getIceServers();
    res.status(200).json(iceServers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ICE servers' });
  }
}; 