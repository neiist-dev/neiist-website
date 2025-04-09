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
	const members = choices[option as "all" | "resume"] || [];
	res.json(members);
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

		await collaboratorsService.addNewCollab(username, newCollabInfo);
		res.json("OK");
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

		await collaboratorsService.removeCollab(username);
		res.json("OK");
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

	if (!username) {
		res.status(400).json({ error: "Username is required" });
		return;
	}

	const state = await collaboratorsService.getCollabTeams(username);
	res.json(state);
});
