const db = require('../db/areasQueries');

const uploadAreas = async (areas) => {
  db.setAreas(areas);
};

const getAreas = async () => {
  const areas = db.getAreas();
  return areas;
};

module.exports = {
  uploadAreas,
  getAreas,
};
