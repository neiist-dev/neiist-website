import express from "express";
import { authMiddleware } from "../utils/middleware";
import { membersService } from "./service";

export const membersRouter = express.Router();
membersRouter.use(express.json());

membersRouter.post("/", async (req, res) => {
	const member = req.body;
	try {
		// Consider validation of member data before passing to service
		await membersService.registerMember(member);
		res.status(201).json({ username: member.username });
	} catch (error) {
		console.error("Error registering member:", error);
		res.status(500).json({ error: "Failed to register member" });
	}
});

membersRouter.get("/status/:username", async (req, res) => {
	const { username } = req.params;
	if (
		!req.session.user ||
		(username !== req.session.user.username && !req.session.user.isGacMember)
	) {
		res.status(403).json({ error: "Forbidden" });
		return;
	}

	try {
		const member = await membersService.getMemberStatus(username);
		if (!member) {
			return res.status(404).json({ error: "Member not found" });
		}
		res.json(member);
	} catch (error) {
		console.error("Error getting member status:", error);
		res.status(500).json({ error: "Failed to get member status" });
	}
});

membersRouter.get("/:username", authMiddleware, async (req, res) => {
	const { username } = req.params;

	if (!username) {
		res.status(400).json({ error: "Username is required" });
		return;
	}

	if (
		username !== req.session.user?.username &&
		!req.session.user?.isGacMember
	) {
		res.status(403).json({ error: "Forbidden" });
		return;
	}

	const member = await membersService.getMember(username);
	res.json(member);
});

membersRouter.put("/:username", authMiddleware, async (req, res) => {
	const { username } = req.params;

	if (!username) {
		res.status(400).json({ error: "Username is required" });
		return;
	}

	if (
		username !== req.session.user?.username &&
		!req.session.user?.isGacMember
	) {
		res.status(403).json({ error: "Forbidden" });
		return;
	}

	const nameEmailCourses = req.body;
	await membersService.renovateMember(username, nameEmailCourses);
	res.json(username);
});
