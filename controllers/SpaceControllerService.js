'use strict';

const jwt = require('jsonwebtoken');
const utils = require('../utils');
const prisma = require('../prisma');

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
  const spaceToBePublished = JSON.parse(req.swagger.params.body.value.space);
  const imagesToBePublished = req.swagger.params.body.files;
  const authToken = req.cookies?.authToken;

  console.log(req.swagger.params.body);

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      if (!spaceToBePublished.ownerId) {
        res.status(400).send('Missing required attributes');
        return;
      }

      if (decoded.role === 'USER' || decoded.userId !== parseInt(spaceToBePublished.ownerId)) {
        res.status(403).send('Forbidden');
        return;
      }

      const errors = utils.checkSpaceValidity(spaceToBePublished, imagesToBePublished);
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
            create: imagesToBePublished?.map(image => {
              return { image: image.buffer, name: image.originalname, mimetype: image.mimetype, size: image.size };
            })
          }
        }
      }).then(() => {
        res.status(201).send('Space created successfully');
      }).catch((err) => {
        console.log(err);
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
