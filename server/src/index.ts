import path from "node:path";
import cors from "cors";
import express from "express";
import session, { type SessionOptions } from "express-session";
import morgan from "morgan";
import fs from "fs/promises";
import { areasRoute as areasRouter } from "./areas/router";
import { authRoute as authRouter } from "./auth/router";
import { collaboratorsRouter } from "./collaborators/router";
import { adminElectionsRouter, electionsRouter } from "./elections/router";
import { gacRoute as gacRouter } from "./gac/router";
import { membersRouter } from "./members/router";
import { storeRouter } from "./store/router";
import { thesesRouter } from "./theses/router";
import { cvsRouter } from "./cvs/router";
import { banner } from "./utils/banner";
import { initializeSchema } from "./utils/databaseSchema";

// Path constants
const CLIENT_DIR = path.join(__dirname, "../../client");
const CLIENT_BUILD_DIR = path.join(CLIENT_DIR, "build");
const CLIENT_PUBLIC_DIR = path.join(CLIENT_DIR, "public");
const MAINTENANCE_DIR = path.join(CLIENT_PUBLIC_DIR, "maintenance");

const app = express();
app.use(cors());
app.use(morgan("tiny"));

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
	console.error("SESSION_SECRET is not set in the environment variables");
	process.exit(1);
}

// Session setup
const sess: SessionOptions = {
	secret: SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 24 * 60 * 60 * 1000, // 1 day
		httpOnly: true,
		secure: false, // Sets to true if production
		sameSite: "lax", // Helps prevent CSRF
	},
};

if (app.get("env") === "production") {
	app.set("trust proxy", 1); // trust first proxy
	if (sess.cookie) sess.cookie.secure = true; // serve secure cookies
}
app.use(session(sess));

// Maintenance assets
const maintenanceAssets = express.static(MAINTENANCE_DIR);

app.use(async (req, res, next) => {
	try {
		await fs.access(path.join(CLIENT_BUILD_DIR, "index.html"));
		next(); // Build exists, proceed as normal
	} catch (err) {
		if (req.path === "/favicon.png") {
			return res.sendFile(path.join(CLIENT_PUBLIC_DIR, "favicon.png"));
		}
		if (req.path.startsWith("/maintenance/")) {
			req.url = req.url.replace(/^\/maintenance/, "");
			return maintenanceAssets(req, res, next);
		}
		res
			.status(503)
			.sendFile(path.join(MAINTENANCE_DIR, "maintenance.html"));
	}
});

// create db tables if needed
initializeSchema()
	.then(() => {
		console.log("Database schema initialized successfully");
	})
	.catch((error) => {
		console.error("Failed to initialize database schema:", error);
		process.exit(1);
	});

// serve frontend
app.use(express.static(CLIENT_BUILD_DIR));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/areas", areasRouter);
app.use("/api/theses", thesesRouter);
app.use("/api/admin/elections", adminElectionsRouter);
app.use("/api/members", membersRouter);
app.use("/api/collabs", collaboratorsRouter);
app.use("/api/mag", gacRouter);
app.use("/api/elections", electionsRouter);
app.use("/api/store", storeRouter);
app.use("/api/cvs", cvsRouter);

// Serve static files for product images
app.use("/images", express.static(path.join(__dirname, "../../uploads/store")));

// Handle all other routes
app.get("/*all", (_, res) => {
	res.sendFile(path.join(CLIENT_BUILD_DIR, "index.html"), (err) => {
		if (err) {
			res.status(500).send(err);
		}
	});
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
	console.log(banner);
	console.log(`App is listening on port ${port}.`);
});
