'use strict';

const varSmartSearchControllerService = require('./SmartSearchControllerService');

module.exports.postTrainSpaces = function postTrainSpaces(req, res, next) {
    varSmartSearchControllerService.postTrainSpaces(req, res, next);
}
module.exports.getSpaces = function getSpaces (req, res, next) {
  varSmartSearchControllerService.getSpaces(req, res, next);
};

