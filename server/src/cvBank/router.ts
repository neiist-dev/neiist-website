import express from "express";
import fileUpload from "express-fileupload";
import { uploadCV, findUserCVFileId, removeUserCV, downloadUserCV } from "./service";
import { authMiddleware } from "../utils/middleware";

export const cvBankRouter = express.Router();
cvBankRouter.use(fileUpload());

cvBankRouter.get("/", authMiddleware, async (req, res) => {
  const username = req.session.user?.username;
  if (!username) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const fileId = await findUserCVFileId(username);
  res.json({ hasCV: !!fileId });
});

cvBankRouter.delete("/", authMiddleware, async (req, res) => {
  const username = req.session.user?.username;
  if (!username) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const removed = await removeUserCV(username);
  res.json({ removed });
});

cvBankRouter.get("/download", authMiddleware, async (req, res) => {
  const username = req.session.user?.username;
  if (!username) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const buffer = await downloadUserCV(username);
  if (!buffer) {
    res.status(404).json({ error: "CV not found" });
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  if (!req.query.preview) {
    res.setHeader("Content-Disposition", `attachment; filename="${username}.pdf"`);
  }
  res.send(buffer);
});

cvBankRouter.post("/", authMiddleware, async (req, res) => {
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
    await removeUserCV(username);

    const filename = `${username}.pdf`;
    const result = await uploadCV(file.data, filename);
    res.json(result);
  } catch (err) {
    console.error("Error uploading CV:", err);
    res.status(500).json({ error: "Failed to upload CV" });
  }
});
