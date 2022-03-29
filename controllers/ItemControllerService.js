'use strict';

const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { ItemType, Dimensions } = require('@prisma/client');

module.exports.getItemsTypes = function getItemsTypes (req, res, next) {
  try {
    const itemsTypes = Object.values(require('@prisma/client').ItemType);
    res.status(200).send(itemsTypes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports.getItemsDimensions = function getItemsDimensions (req, res, next) {
  try {
    const itemsDimensions = Object.values(require('@prisma/client').Dimensions);
    res.status(200).send(itemsDimensions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports.postItems = async function postItems (req, res, next) {
  const authToken = req.cookies?.authToken;
  const itemsToBePublished = req.swagger.params.body.value;

  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

      if (!itemsToBePublished.every(item => Object.values(ItemType).includes(item.type))) {
        res.status(400).send('Invalid item type. It must be one of the following: ' + Object.values(ItemType).join(', '));
        return;
      }

      if (!itemsToBePublished.every(item => Object.values(Dimensions).includes(item.dimensions))) {
        res.status(400).send('Invalid item dimensions. It must be one of the following: ' + Object.values(Dimensions).join(', '));
        return;
      }

      await prisma.user.update({
        where: {
          id: parseInt(decoded.userId)
        },
        data: {
          items: {
            deleteMany: {},
            create: itemsToBePublished?.map(itemToBePublished => {
              return {
                amount: itemToBePublished.amount,
                item: {
                  connectOrCreate: {
                    where: {
                      type_dimensions: {
                        type: itemToBePublished.type,
                        dimensions: itemToBePublished.dimensions
                      }        
                    },
                    create: {type: itemToBePublished.type, dimensions: itemToBePublished.dimensions}
                  }
                }
              }
            })
          }
        }
      }).then(() => {
        res.status(201).send('User items created successfully');
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
