'use strict';

module.exports.getTags = function getTags (req, res, next) {
  try {
    const tags = Object.values(require('@prisma/client').TagEnum);
    res.status(200).send(tags);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
