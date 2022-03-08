'use strict';

const utils = require('../utils');
const prisma = require("../prisma");

module.exports.getSpaces = function getSpaces (req, res, next) {
  prisma.space.findMany({})
  .then(  spaces => {
    res.send(spaces.map(space => utils.excludeNulls(space)));
  })
  .catch(err => {
    console.error(err);
    res.status(500).send("Server error: Could not get spaces.");
  })

};

module.exports.getSpace = function getSpace (req, res, next) {
  prisma.space.findUnique({
    where: {
      id:parseInt(req.spaceId.value)
    }
  })
  .then(space => {
    if(!space){ res.status(404).send("Space not found"); }
    else{res.send(utils.excludeNulls(space)); }
  })
  .catch(err => {
    console.error(err);
    res.status(500).send("Server error: Could not get spaces.")
  })

};

module.exports.getSpaceRentals = function getSpaceRentals (req, res, next) {
  prisma.space.findUnique({
    where:{
      id: parseInt(req.spaceId.value)
    },
    include: {
      rentals:{
        select:{
          initialDate: true,
          finalDate: true,
          cost: true,
          type: true,
          meters: true,
          spaceId: true,
          renterId: true,
        }
      }
    }
  })
  .then(space => {
    if(!space) { res.status(404).send("Space not found"); }
    else{res.send(space.rentals); }
  })
  .catch(err => {
    console.error(err);
    res.status(500).send("Server error: Could not get spaces.")
  })

};
