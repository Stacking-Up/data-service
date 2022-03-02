'use strict';

module.exports.getSpaces = function getSpaces (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getSpaces'
  });
};

module.exports.getSpace = function getSpace (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getSpace'
  });
};

module.exports.getSpaceRentals = function getSpaceRentals (req, res, next) {
  res.send({
    message: 'This is the mockup controller for getSpaceRentals'
  });
};
