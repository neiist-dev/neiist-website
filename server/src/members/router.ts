import express from 'express';
import { membersService } from './service';
import { authMiddleware } from '../utils/middleware';

export const membersRouter = express.Router();
membersRouter.use(express.json());

membersRouter.post('/', async (req, res) => {
  const member = req.body;
  await membersService.registerMember(member);
  res.json(member.username);
});

membersRouter.get('/status/:username', async (req, res) => {
  const { username } = req.params;
  if (!req.session.user || (username !== req.session.user.username && !req.session.user.isGacMember)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const member = await membersService.getMemberStatus(username);
  res.json(member);
});

membersRouter.get('/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;
  if (username !== req.session.user?.username && !req.session.user?.isGacMember) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const member = await membersService.getMember(username!);
  res.json(member);
});

membersRouter.put('/:username', authMiddleware, async (req,res) => {
  const { username } = req.params;
  if (username !== req.session.user?.username && !req.session.user?.isGacMember) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const nameEmailCourses = req.body;
  await membersService.renovateMember(username!, nameEmailCourses);
  res.json(username);
});
