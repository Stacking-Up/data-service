'use strict';

module.exports.getItemsTypes = function getItemsTypes (req, res, next) {
  try {
    const itemsTypes = Object.values(require('@prisma/client').ItemType);
    res.status(200).send(itemsTypes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports.getItemsDimensions = function getItemsDimensions (req, res, next) {
  try {
    const itemsDimensions = Object.values(require('@prisma/client').Dimensions);
    res.status(200).send(itemsDimensions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
