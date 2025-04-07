import express from 'express';
import { electionsService } from './service';
import { Vote } from './dto';
import { adminMiddleware, authMiddleware, gacMiddleware } from '../utils/middleware';

export const adminElectionsRouter = express.Router();
adminElectionsRouter.use(express.json());

adminElectionsRouter.get('/', adminMiddleware, async (req, res) => {
  const elections = await electionsService.getAllElections();
  res.json(elections);
});

export const electionsRouter = express.Router();
electionsRouter.use(express.json());
    
electionsRouter.post('/', gacMiddleware, async (req, res) => {
  const election = req.body;
  await electionsService.newElection(election);
  res.status(201).json({ message: 'Election created successfully' });
});

electionsRouter.get('/', async (req, res) => {
  const elections = await electionsService.getActiveElections();
  res.json(elections);
});

electionsRouter.post('/:id/votes', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const vote = req.body as Vote;

  if (!req.session.user?.username) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }
  
  vote.username = req.session.user?.username;

  await electionsService.newVote(id, vote);
});