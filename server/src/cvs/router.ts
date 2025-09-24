import express from "express";
import fileUpload from "express-fileupload";
import { uploadCV } from "./service";
import { authMiddleware } from "../utils/middleware";

export const cvsRouter = express.Router();
cvsRouter.use(fileUpload());

cvsRouter.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.files || !req.files.cv) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const file = Array.isArray(req.files.cv) ? req.files.cv[0] : req.files.cv;
    if (!file || file.mimetype !== "application/pdf") {
      res.status(400).json({ error: "Only PDF files allowed" });
      return;
    }
    const username = req.session.user?.username;
    if (!username) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const dateNow = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const date = `${dateNow.getFullYear()}-${pad(dateNow.getMonth() + 1)}-${pad(dateNow.getDate())}_${pad(dateNow.getHours())}-${pad(dateNow.getMinutes())}-${pad(dateNow.getSeconds())}`;
    const filename = `${username}_${date}.pdf`;

    const result = await uploadCV(file.data, filename);
    res.json(result);
  } catch (err) {
    console.error("Error uploading CV:", err);
    res.status(500).json({ error: "Failed to upload CV" });
  }
});
