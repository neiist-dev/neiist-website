import express from "express";
import { membersService } from "../members/service";
import { gacMiddleware } from "../utils/middleware";

export const gacRoute = express.Router();
gacRoute.use(express.json());

gacRoute.get("/:choice", gacMiddleware, async (req, res) => {
	const { choice } = req.params;

	const options = {
		active: () => membersService.getActiveMembers(),
		all: () => membersService.getAllMembers(),
		renewalNotifications: () => membersService.getRenewMembersWarned(),
	};

	const members =
		await options[choice as "active" | "all" | "renewalNotifications"]();
	res.json(members);
});

gacRoute.put("/delete/:username", gacMiddleware, async (req, res) => {
	const { username } = req.params;

	if (!username) {
		res.status(400).json({ error: "Username is required" });
		return;
	}

	await membersService.removeMember(username);
	res.json(username);
});

gacRoute.post("/update/email/:username", gacMiddleware, async (req, res) => {
	const { username } = req.params;
	const changedEmail = req.body.changedEmail;

	if (!username) {
		res.status(400).json({ error: "Username is required" });
		return;
	}

	await membersService.updateEmailMember(username, changedEmail);
	res.json(username);
});

gacRoute.post("/warnedMember/:username", gacMiddleware, async (req, res) => {
	const { username } = req.params;

	if (!username) {
		res.status(400).json({ error: "Username is required" });
		return;
	}

	await membersService.addRenewMemberWarned(username);
	res.json(username);
});
