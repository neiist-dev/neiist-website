import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session, { SessionOptions } from 'express-session';
import path from 'path';
import { adminElectionsRouter, electionsRouter } from './elections/router';
import { initializeSchema } from './utils/databaseSchema';
import { banner } from './utils/banner';
import { areasRoute as areasRouter } from './areas/router';
import { authRoute as authRouter } from './auth/router';
import { collaboratorsRouter } from './collaborators/router';
import { thesesRouter } from './theses/router';
import { membersRouter } from './members/router';
import { storeRouter } from './store/router';
import { gacRoute as gacRouter } from './gac/router';

const app = express();
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
    console.error('SESSION_SECRET is not set in the environment variables');
    process.exit(1);
}

app.use(cors());
app.use(morgan('tiny'));

// Session
const sess: SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        secure: false, // Sets to true if production
    }
}

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie!.secure = true // serve secure cookies
}
app.use(session(sess));

// create db tables if needed
initializeSchema();

// serve frontend
app.use(express.static(path.join(__dirname, "../client/build")));

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

// Serve static files for product images
app.use("/images", express.static(path.join(__dirname, "../uploads/store")));

// Handle all other routes
app.get("/*all", function (req, res) {
  res.sendFile(
    path.join(__dirname, "../client/build/index.html"),
    function (err) {
      if (err) {
        res.status(500).send(err);
      }
    }
  );
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(banner);
  console.log(`App is listening on port ${port}.`);
});
