'use strict';

const utils = require('../utils');
const prisma = require('../prisma');

module.exports.getUsers = function getUsers (req, res, next) {
  prisma.user.findMany({})
    .then( users => {
      res.send(users.map(user => utils.excludeNulls(user)));
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Server error: Could not get users");
    });
};

module.exports.getUser = function getUser (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    }
  })
    .then( user => {
      if (!user) { res.status(404).send("User not found"); }
      else { res.send(utils.excludeNulls(user)); }      
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Server error: Could not get users");
    });
};

module.exports.getUserItems = function getUserItems (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    },
    include: {
      items: {
        select: {
          type: true,
          dimensions: true,
        },
      },
    },
  })
    .then(user => {
      if (!user) { res.status(404).send("User not found"); }
      else { res.send(user.items); }      
   })
    .catch(err => {
      console.error(err);
      res.status(500).send("Server error: Could not get users");
    });
};

module.exports.getUserItem = function getUserItem (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserItem'
  });
};

module.exports.getUserRatings = function getUserRatings (req, res, next) {
  prisma.rating.findMany({
    skip: req.offset.value,
    take: req.limit.value,
    where: {
      OR: [
        { receiverId: { equals: parseInt(req.userId.value), }, },
        { reviewerId: { equals: parseInt(req.userId.value), }, },
    ],
   },
    select:
      {
        title: true,
        description: true,
        rating: true,
        reviewerId: true,
        receiverId: true,
      }
  })
    .then(rating => {
      if (!rating) { res.status(404).send("Ratings not found"); }
      req.filter.value? res.send(utils.filterRatings(rating, req)) : res.send(rating);
   })
    .catch(err => {
      console.error(err);
      res.status(500).send("Server error: Could not get ratings");
  });  
};

module.exports.getUserRating = function getUserRating (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserRating'
  });
};

module.exports.getUserSpaces = function getUserSpaces (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserSpaces'
  });
};

module.exports.getUserSpace = function getUserSpace (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserSpace'
  });
};

module.exports.getUserRentals = function getUserRentals (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserRentals'
  });
};

module.exports.getUserRental = function getUserRental (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserRental'
  });
};
