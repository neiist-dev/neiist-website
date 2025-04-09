import express from "express";
import { authService } from "./service";
export const authRoute = express.Router();

authRoute.get("/accessToken/:code", async (req, res) => {
	const { code } = req.params;
	const accessToken = await authService.getAccessToken(code);
	res.send(accessToken);
});

authRoute.get("/userData/:accessToken", async (req, res) => {
	const { accessToken } = req.params;
	try {
		const userData = await authService.getUserData(accessToken);
		req.session.user = userData;
		res.json(userData);
	} catch (error) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		res.status(401).send((error as any).message);
	}
});
