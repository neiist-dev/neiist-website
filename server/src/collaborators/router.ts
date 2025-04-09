import express from "express";
import { adminMiddleware, authMiddleware } from "../utils/middleware";
import { collaboratorsService } from "./service";
export const collaboratorsRouter = express.Router();

collaboratorsRouter.use(express.json());

collaboratorsRouter.get("/:option", async (req, res) => {
	const choices = {
		all: await collaboratorsService.getCurrentCollabs(),
		resume: await collaboratorsService.getCurrentCollabsResume(),
	};

	const { option } = req.params;
	
	// Validate the option parameter
	if (option !== 'all' && option !== 'resume') {
		return res.status(400).json({ error: "Invalid option. Use 'all' or 'resume'." });
	}
	
	try {
		const members = choices[option as "all" | "resume"];
		res.json(members);
	} catch (error) {
		console.error(`Error fetching collaborators (${option}):`, error);
		res.status(500).json({ error: "Failed to fetch collaborators" });
	}
});

collaboratorsRouter.post(
	"/add/:username",
	adminMiddleware,
	async (req, res) => {
		const { username } = req.params;
		const newCollabInfo = req.body;

		if (!username) {
			res.status(400).json({ error: "Username is required" });
			return;
		}

		try {
			await collaboratorsService.addNewCollab(username, newCollabInfo);
			res.status(201).json({ message: "Collaborator added successfully" });
		} catch (error) {
			console.error("Error adding collaborator:", error);
			res.status(500).json({ error: "Failed to add collaborator" });
		}
	},
);

collaboratorsRouter.post(
	"/remove/:username",
	adminMiddleware,
	async (req, res) => {
		const { username } = req.params;

		if (!username) {
			res.status(400).json({ error: "Username is required" });
			return;
		}

		try {
			await collaboratorsService.removeCollab(username);
			res.status(200).json({ message: "Collaborator removed successfully" });
		} catch (error) {
			console.error("Error removing collaborator:", error);
			res.status(500).json({ error: "Failed to remove collaborator" });
		}
	},
);

collaboratorsRouter.get("/info/:username", authMiddleware, async (req, res) => {
	const { username } = req.params;
	if (
		username !== req.session.user?.username &&
		!req.session.user?.isGacMember
	) {
		res.status(403).json({ error: "Forbidden" });
		return;
	}

	try {
		const state = await collaboratorsService.getCollabTeams(username);
		if (!state) {
			return res.status(404).json({ error: "Collaborator not found" });
		}
		res.json(state);
	} catch (error) {
		console.error("Error fetching collaborator teams:", error);
		res.status(500).json({ error: "Failed to fetch collaborator teams" });
	}
});
