'use strict';

const jwt = require('jsonwebtoken');
const utils = require('../utils');
const prisma = require('../prisma');
const { Prisma } = require('@prisma/client');

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

module.exports.postSpace = async function postSpace (req, res, next) {
  const authToken = req.cookies?.authToken;
  const spaceToBePublished = req.swagger.params.body.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      if (!spaceToBePublished.ownerId) {
        res.status(400).send('Missing required attributes');
        return;
      }

      if (decoded.role === 'USER' || parseInt(decoded.userId) !== parseInt(spaceToBePublished.ownerId)) {
        res.status(403).send('Forbidden');
        return;
      }

      const errors = utils.checkSpaceValidity(spaceToBePublished);
      if (errors.length > 0) {
        res.status(400).send(`Bad Request: ${errors[0]}`);
        return;
      }

      await prisma.space.create({
        data: {
          name: spaceToBePublished.name,
          description: spaceToBePublished.description,
          initialDate: new Date(spaceToBePublished.initialDate),
          finalDate: spaceToBePublished.finalDate ? new Date(spaceToBePublished.finalDate) : null,
          location: spaceToBePublished.location,
          dimensions: spaceToBePublished.dimensions,
          priceHour: parseFloat(spaceToBePublished.priceHour),
          priceDay: parseFloat(spaceToBePublished.priceDay),
          priceMonth: parseFloat(spaceToBePublished.priceMonth),
          shared: spaceToBePublished.shared,
          owner: {
            connect: {
              id: parseInt(spaceToBePublished.ownerId)
            }
          },
          tags: {
            connectOrCreate: spaceToBePublished.tags?.map(tag => {
              return {
                where: { tag: String(tag) },
                create: { tag: String(tag) }
              };
            })
          },
          images: {
            create: spaceToBePublished.images?.map(base64 => {
              return {image: Buffer.from(base64, 'base64'), mimetype: base64.indexOf('/9j/') === 0 ? 'image/jpeg' : 'image/png'};
            })
          }
        }
      }).then(() => {
        res.status(201).send('Space created successfully');
      }).catch((err) => {
        console.error(err);
        res.status(500).send('Internal Server Error');
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

module.exports.putSpace = async function putSpace (req, res, next) {
  const authToken = req.cookies?.authToken;
  const spaceId = req.swagger.params.spaceId.value;
  const spaceToBeUpdated = req.swagger.params.body.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      if (!spaceToBeUpdated.ownerId) {
        res.status(400).send('Missing required attributes');
        return;
      }

      if (decoded.role === 'USER' || parseInt(decoded.userId) !== parseInt(spaceToBeUpdated.ownerId)) {
        res.status(403).send('Forbidden');
        return;
      }

      if (!spaceId.match(/^\d+$/)) {
        res.status(400).send('Invalid spaceId. It must be an integer number');
        return;
      }

      const errors = utils.checkSpaceValidity(spaceToBeUpdated);
      if (errors.length > 0) {
        res.status(400).send(`Bad Request: ${errors[0]}`);
        return;
      }

      await prisma.space.update({
        where: {
          id: parseInt(spaceId)
        },
        data: {
          name: spaceToBeUpdated.name,
          description: spaceToBeUpdated.description,
          initialDate: new Date(spaceToBeUpdated.initialDate),
          finalDate: spaceToBeUpdated.finalDate ? new Date(spaceToBeUpdated.finalDate) : null,
          location: spaceToBeUpdated.location,
          dimensions: spaceToBeUpdated.dimensions,
          priceHour: parseFloat(spaceToBeUpdated.priceHour),
          priceDay: parseFloat(spaceToBeUpdated.priceDay),
          priceMonth: parseFloat(spaceToBeUpdated.priceMonth),
          shared: spaceToBeUpdated.shared,
          owner: {
            connect: {
              id: parseInt(spaceToBeUpdated.ownerId)
            }
          },
          tags: {
            set: [],
            connectOrCreate: spaceToBeUpdated.tags?.map(tag => {
              return {
                where: { tag: String(tag) },
                create: { tag: String(tag) }
              };
            }),
          },
          images: {
            deleteMany: {},
            create: spaceToBeUpdated.images?.map(base64 => {
              return {image: Buffer.from(base64, 'base64'), mimetype: base64.indexOf('/9j/') === 0 ? 'image/jpeg' : 'image/png'};
            })
          }
        }
      }).then(() => {
        res.status(201).send('Space updated successfully');
      }).catch((err) => {
        if(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          res.status(400).send('No space records found');
        } else {
          console.error(err);
          res.status(500).send('Internal Server Error');
        }
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
