'use strict';

const varTagController = require('./TagControllerService');

module.exports.getTags = function getTags (req, res, next) {
  varTagController.getTags(req.swagger.params, res, next);
};
