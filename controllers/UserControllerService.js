'use strict';

const { PrismaClient } = require('@prisma/client');
const utils = require('../utils');
const prisma = new PrismaClient();

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
  res.send({
    message: 'This is the mockup controller for getUser'
  });
};

module.exports.getUserItems = function getUserItems (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserItems'
  });
};

module.exports.getUserItem = function getUserItem (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserItem'
  });
};

module.exports.getUserRatings = function getUserRatings (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getUserRatings'
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
