'use strict';

const { smartSearch } = require('../utils');
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');

module.exports.getSpaces = async function getSpaces (req, res, next) {
  const authToken = req.cookies?.authToken;
  const items = req.swagger.params.items.value;
  let recommendedSpaces = [];

  if (!items || items.length === 0) {
    res.status(400).send('No items provided');
    return;
  }
  // Recomendations based on tfidf
  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      const rentals = await prisma.rental.findMany({
        where: {
          userId: decoded.id
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
        recommendedSpaces = rentals.flatMap(rental => smartSearch.spaceModel[rental.space.id]);
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
  // TODO recomenation based on tags and location
  res.status(200).send(recommendedSpaces);
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
