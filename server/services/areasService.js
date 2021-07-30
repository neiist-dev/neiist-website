const { areasDatabase } = require('../database');

const uploadAreas = async (areas) => {
  areasDatabase.setAreas(areas);
};

const getAreas = async () => {
  const areas = areasDatabase.getAreas();
  return areas;
};

module.exports = {
  uploadAreas,
  getAreas,
};
