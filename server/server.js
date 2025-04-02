const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const { databaseSchema } = require("./database");

const {
  authRoute,
  areasRoute,
  thesesRoute,
  membersRoute,
  collabsRoute,
  electionsRoute,
  adminElectionsRoute,
  gacRoute,
  storeRoute,
} = require("./routes");

const app = express();
app.use(cors());
app.use(morgan("tiny"));

// create db tables if needed
databaseSchema.initializeSchema();

// serve frontend
app.use(express.static(path.join(__dirname, "../client/build")));

// API routes
app.use("/api/auth", authRoute);
app.use("/api/areas", areasRoute);
app.use("/api/theses", thesesRoute);
app.use("/api/admin/elections", adminElectionsRoute);
app.use("/api/members", membersRoute);
app.use("/api/collabs", collabsRoute);
app.use("/api/mag", gacRoute);
app.use("/api/elections", electionsRoute);
app.use("/api/store", storeRoute);

// Serve static files for product images
app.use("/images", express.static(path.join(__dirname, "../uploads/store")));

// Handle all other routes
app.get("/*", function (req, res) {
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
  console.log(`App is listening on port ${port}.`);
});
