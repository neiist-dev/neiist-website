import express from "express";
import fileUpload from "express-fileupload";
import { adminMiddleware } from "../utils/middleware";
import { areasService } from "./service";

export const areasRoute = express.Router();

areasRoute.use(fileUpload());
areasRoute.use(express.urlencoded({ extended: true }));
areasRoute.use(express.json());

areasRoute.get("/", async (req, res) => {
	try {
		const areas = await areasService.getAreas();
		res.json(areas);
	} catch (error) {
		console.error("Error fetching areas:", error);
		res.status(500).json({ error: "Failed to retrieve areas" });
	}
});

areasRoute.post("/", adminMiddleware, async (req, res) => {
	try {
		await areasService.uploadAreas(req.body);
		res.status(200).json({ message: "Areas uploaded successfully" });
	} catch (error) {
		console.error("Error uploading areas:", error);
		res.status(500).json({ error: "Failed to upload areas" });
	}
});
