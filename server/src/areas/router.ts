import express from "express";
import fileUpload from "express-fileupload";
import { adminMiddleware } from "../utils/middleware";
import { areasService } from "./service";

export const areasRoute = express.Router();

areasRoute.use(fileUpload());
areasRoute.use(express.urlencoded({ extended: true }));
areasRoute.use(express.json());

areasRoute.get("/", async (req, res) => {
	const areas = await areasService.getAreas();
	res.json(areas);
});

areasRoute.post("/", adminMiddleware, async (req, res) => {
	await areasService.uploadAreas(req.body);
	res.sendStatus(200);
});
