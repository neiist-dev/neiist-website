const express = require('express');
const cors = require('cors');
const path = require('path');
const { databaseSchema } = require('./database');

const {
  authRoute, areasRoute, thesesRoute, membersRoute, electionsRoute,
} = require('./routes');

const app = express();
app.use(cors());

// create db tables if needed
databaseSchema.initializeSchema();

// serve frontend
app.use(express.static(path.join(__dirname, '../client/build')));

app.use('/api/auth', authRoute);
app.use('/api/areas', areasRoute);
app.use('/api/theses', thesesRoute);
app.use('/api/members', membersRoute);
app.use('/api/elections', electionsRoute);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`App is listening on port ${port}.`);
});
