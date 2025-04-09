import express from "express";
import fileUpload from "express-fileupload";
import { adminMiddleware } from "../utils/middleware";
import { thesesService } from "./service";
export const thesesRouter = express.Router();

thesesRouter.use(fileUpload());
thesesRouter.use(express.urlencoded({ limit: "50mb", extended: true }));
thesesRouter.use(express.json({ limit: "50mb" }));

thesesRouter.post("/", adminMiddleware, async (req) => {
	if (!req.files || !req.files.theses) {
		throw new Error("No files were uploaded.");
	}

	const thesesHtmlFiles = req.files.theses;
	const thesesHtmlFile = Array.isArray(thesesHtmlFiles)
		? thesesHtmlFiles[0]
		: thesesHtmlFiles;
	if (!thesesHtmlFile) {
		throw new Error("No files were uploaded.");
	}

	const thesesHtmlData = thesesHtmlFile.data;
	const thesesHtml = thesesHtmlData.toString();
	await thesesService.uploadTheses(thesesHtml);
});

thesesRouter.get("/", async (req, res) => {
	const theses = await thesesService.getTheses();
	res.json(theses);
});
