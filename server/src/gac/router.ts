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

	const validChoices = ["active", "all", "renewalNotifications"];
	if (!validChoices.includes(choice)) {
		res.status(400).json({ error: "Invalid choice parameter" });
		return;
	}

	try {
		const members =
			await options[choice as "active" | "all" | "renewalNotifications"]();
		res.json(members);
	} catch (error) {
		console.error("Error fetching members:", error);
		res.status(500).json({ error: "Failed to fetch members" });
	}
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

	if (!changedEmail || typeof changedEmail !== "string" || !changedEmail.includes("@")) {
		res.status(400).json({ error: "Valid email is required" });
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

	try {
		await membersService.addRenewMemberWarned(username);
		res.json(username);
	} catch (error) {
		console.error("Error adding member to warned list:", error);
		res.status(500).json({ error: "Failed to add member to warned list" });
	}
});
