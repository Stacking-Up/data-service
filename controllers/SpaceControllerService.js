'use strict';

const utils = require('../utils');
const prisma = require('../prisma');

module.exports.getSpaces = function getSpaces (req, res, next) {
  // Get tags selected for tag filtering
  const tagsFilter = req.tag.value !== undefined ? utils.parseTags(req.tag.value) : [];

  // Get max and min values for dimensions filtering
  const minDimension = req.minDim.value !== undefined ? req.minDim.value : 0;
  const maxDimension = req.maxDim.value !== undefined ? req.maxDim.value : Number.MAX_VALUE;

  // Get max and min values for priceHour filtering
  const minPriceHour = req.minPriceHour.value !== undefined ? req.minPriceHour.value : 0;
  const maxPriceHour = req.maxPriceHour.value !== undefined ? req.maxPriceHour.value : Number.MAX_VALUE;

  // Get max and min values for priceDay filtering
  const minPriceDay = req.minPriceDay.value !== undefined ? req.minPriceDay.value : 0;
  const maxPriceDay = req.maxPriceDay.value !== undefined ? req.maxPriceDay.value : Number.MAX_VALUE;

  // Get max and min values for priceMonth filtering
  const minPriceMonth = req.minPriceMonth.value !== undefined ? req.minPriceMonth.value : 0;
  const maxPriceMonth = req.maxPriceMonth.value !== undefined ? req.maxPriceMonth.value : Number.MAX_VALUE;

  const sort = {};
  if (req.orderBy.value !== undefined && req.orderBy.value.match(/(?:price(?:Hour|Day|Month)|initialDate)-(?:asc|desc)/)) {
    const [key, value] = req.orderBy.value.split('-');
    sort[key] = value || 'desc';
  }

  const actualDate = new Date();
  actualDate.setMilliseconds(0);
  prisma.space.findMany({
    take: req.limit.value,
    skip: req.offset.value,
    where: {
      AND: [
        { shared: { equals: req.shared.value } },
        {
          OR: [
            { finalDate: { gte: actualDate } },
            { finalDate: { equals: null } }
          ]
        }
      ]
    },
    include: {
      tags: true
    },
    orderBy: sort
  })
    .then(spaces => {
      res.send(spaces.filter(space =>
        utils.inRange(minDimension, maxDimension, utils.getMeters(space.dimensions)) &&
        utils.includesTags(tagsFilter, utils.tagsToArray(space.tags)) &&
        utils.inRange(minPriceHour, maxPriceHour, space.priceHour) &&
        utils.inRange(minPriceDay, maxPriceDay, space.priceDay) &&
        utils.inRange(minPriceMonth, maxPriceMonth, space.priceMonth) &&
        utils.isRentedPer(req.isRentPerHour.value, space.priceHour) &&
        utils.isRentedPer(req.isRentPerDay.value, space.priceDay) &&
        utils.isRentedPer(req.isRentPerMonth.value, space.priceMonth)
      ).map(space => utils.notNulls(space)));
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get spaces');
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
