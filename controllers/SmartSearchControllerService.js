'use strict';

const { smartSearch, space: spaceUtils } = require('../utils');
const { ItemType, Dimensions } = require('@prisma/client');
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');

module.exports.getSpaces = async function getSpaces (req, res, next) {
  const authToken = req.cookies?.authToken;
  const items = req.swagger.params.items.value;
  const latitude = req.swagger.params.latitude.value;
  const longitude = req.swagger.params.longitude.value;

  // Initial checks
  if (!items || items.length === 0) {
    res.status(400).send('No items provided');
    return;
  }

  if (!items.every(item => item instanceof Object &&
      Object.prototype.hasOwnProperty.call(item, 'type') &&
      Object.prototype.hasOwnProperty.call(item, 'dimensions'))) {
    res.status(400).send('Invalid item format');
    return;
  }

  if (!items.map(item => item.type).every(type => Object.values(ItemType).includes(type))) {
    res.status(400).send('Invalid item type');
    return;
  }

  if (!items.map(item => item.dimensions).every(dim => Object.values(Dimensions).includes(dim))) {
    res.status(400).send('Invalid item dimensions');
    return;
  }

  if (!latitude || !longitude) {
    res.status(400).send('No location coords provided');
    return;
  }

  if (isNaN(latitude) || isNaN(longitude)) {
    res.status(400).send('Invalid location coords');
  }

  // Recomendations based on tfidf
  let recommendedSpaces = [];
  await (async () => {
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
        const rentals = await prisma.rental.findMany({
          where: {
            renterId: decoded.userId
          },
          include: {
            space: true
          }
        });

        if (!smartSearch.spaceModel || smartSearch.spaceModel.length === 0) {
          console.warn('Space model has not been trained or is empty');
        } else if (!rentals || rentals.length === 0) {
          console.warn('Requested user has no rentals, cannot recommend spaces based on previous rentals');
        } else {
          recommendedSpaces = rentals
            .flatMap(rental => smartSearch.spaceModel[rental.space.id])
            .reduce((acc, curr, _idx, arr) => {
              const num = arr.filter(s => s.id === curr.id).length || 1;
              if (acc.map(s => s.id).includes(curr.id)) { acc[acc.map(s => s.id).indexOf(curr.id)].score += curr.score / num; } else { acc.push({ id: curr.id, score: curr.score / num }); }
              return acc;
            }, []);
        }
      } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
          console.warn(`Unauthorized: ${err.message}`);
        } else {
          console.error(err);
        }
      }
    } else {
      console.warn('No token found. User is not logged in.');
    }
  })();

  // Recomendations based on tags and location
  await (async () => {
    const diccTags = smartSearch.dictItemsTags;
    const itemTags = [...new Set(items.flatMap(item => diccTags[item.type]))];
    const where = recommendedSpaces.length === 0 ? {} : { id: { in: recommendedSpaces.map(space => space.id) } };

    await prisma.space.findMany({
      where: where,
      include: {
        tags: true
      }
    }).then(allSpaces => {
      let scoredSpaces = [];
      allSpaces
        .filter(space => spaceUtils.getMeters(space.dimensions) >= items.reduce((acc, i) => { acc += smartSearch.dictDimensionsEnum[i.dimensions] * parseInt(i.amount); return acc; }, 0))
        .forEach(space => {
          const [latitudDB, longitudDB] = space.location.split(',');
          const tagScore = smartSearch.scoreTags(itemTags, space.tags.map(tag => tag.tag));
          const locationScore = 1 - smartSearch.calculaDistanceBtw2Points(latitudDB, longitudDB, latitude, longitude) / 15;
          const score = recommendedSpaces.length === 0 ? 0.6 * tagScore + 0.4 * locationScore : recommendedSpaces.find(s => s.id === space.id).score * 0.3 + tagScore * 0.4 + locationScore * 0.3;
          scoredSpaces.push({ id: space.id, score: score });
          scoredSpaces = scoredSpaces.sort((a, b) => b.score - a.score).slice(0, 15);
        });
      res.status(200).send(scoredSpaces);
    }).catch(err => {
      console.error(err);
      res.status(500).send('Internal server error');
    });
  })();
};

module.exports.postTrainSpaces = async function postTrainSpaces (req, res, next) {
  const authToken = req.cookies?.authToken;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

      if (decoded.role !== 'ADMIN') {
        res.status(403).send('Forbidden');
        return;
      }

      await prisma.space.findMany({
        include: {
          tags: true
        }
      }).then(spaces => {
        smartSearch.trainSpaceModel(spaces);
        res.status(200).send('Space model trained');
      }).catch(err => {
        console.error(err);
        res.status(500).send(err);
      });
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).send(`Unauthorized: ${err.message}`);
      } else {
        console.error(err);
        res.status(500).send('Internal Server Error');
      }
    }
  } else {
    res.status(401).send('Unauthorized');
  }
};

module.exports.getRenters = async function getRenters (req, res, next) {
  const authToken = req.cookies?.authToken;
  const spaceId = req.swagger.params.spaceId.value;
  let userId;

  // Initial checks
  if (!authToken) {
    res.status(401).send('Unauthorized');
    return;
  }

  if (!spaceId || !spaceId.toString().match(/^\d+$/)) {
    res.status(400).send('Invalid space id');
    return;
  }

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

    if (decoded.role === 'USER') {
      res.status(403).send('Forbidden');
      return;
    }

    userId = decoded.userId;
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).send(`Unauthorized: ${err.message}`);
    } else {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
    return;
  }

  const space = await prisma.space.findUnique({ where: { id: spaceId }, include: { tags: true } });

  if (!space || !space.tags || space.tags.length === 0) {
    res.status(404).send('Space cannot be found or has no tags to recommend users based on');
    return;
  }

  if (space.ownerId !== userId) {
    res.status(403).send('Forbidden. You cannot get renters of a space you do not own');
    return;
  }

  // Recomendations
  try {
    const tagsPerItemType = space.tags.reduce((acc, tag) => {
      Object.entries(smartSearch.dictItemsTags).forEach(([itemType, itemTags]) => {
        if (itemTags.includes(tag.tag)) acc[itemType] += 1 / itemTags.length;
      });
      return acc;
    }, { APPLIANCES: 0, ELECTRONICS: 0, CLOTHES: 0, FURNITURE: 0, DIYs: 0, OTHER: 0 });

    const userItemsRatio = (await prisma.user.findMany({ include: { items: { select: { amount: true, item: { select: { type: true, dimensions: true } } } } } }))
      .map(user => { return { ...user, items: user.items.map(item => { return { amount: item.amount, type: item.item.type, dimensions: item.item.dimensions }; }) }; })
      .filter(user => user.items && user.items.length > 0)
      .filter(user => spaceUtils.getMeters(space.dimensions) >= user.items.reduce((acc, i) => { acc += smartSearch.dictDimensionsEnum[i.dimensions]; return acc; }, 0))
      .reduce((acc, user) => {
        acc[user.id] = { APPLIANCES: 0, ELECTRONICS: 0, CLOTHES: 0, FURNITURE: 0, DIYs: 0, OTHER: 0 };
        user.items.forEach(i => {
          acc[user.id][i.type] += 1 / user.items.length;
        });
        return acc;
      }, {});

    if (Object.keys(userItemsRatio).length === 0) {
      res.status(404).send('No users found to recommend');
    } else {
      const recommendations = Object.entries(userItemsRatio).reduce((recs, [userId, itemsRatio]) => {
        // Euclidean distance between userItems and spaceTags items
        const score = 1 - Math.sqrt(
          (itemsRatio.APPLIANCES - tagsPerItemType.APPLIANCES) ** 2 +
          (itemsRatio.ELECTRONICS - tagsPerItemType.ELECTRONICS) ** 2 +
          (itemsRatio.CLOTHES - tagsPerItemType.CLOTHES) ** 2 +
          (itemsRatio.FURNITURE - tagsPerItemType.FURNITURE) ** 2 +
          (itemsRatio.DIYs - tagsPerItemType.DIYs) ** 2 +
          (itemsRatio.OTHER - tagsPerItemType.OTHER) ** 2);
        recs.push({ id: parseInt(userId), score: score });
        return recs;
      }, []).sort((a, b) => b.score - a.score).slice(0, 15);
      res.status(200).send(recommendations);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};
