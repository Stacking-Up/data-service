'use strict';

const utils = require('../utils');
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');

module.exports.getUsers = function getUsers (req, res, next) {
  prisma.user.findMany({
    skip: req.offset.value,
    take: req.limit.value
  })
    .then(users => {
      res.send(users.map(user => utils.commons.excludeNulls(user)));
    })
    .catch(err => {
      if ([req.offset.value, req.limit.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid query. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get users');
      }
    });
};

module.exports.getUser = function getUser (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    }
  })
    .then(user => {
      if (!user) {
        res.status(404).send('User not found');
      } else {
        res.send(utils.commons.excludeNulls(user));
      }
    })
    .catch(err => {
      if (!req.userId.value || !req.userId.value.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid userId parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get user');
      }
    });
};

module.exports.getUserItems = function getUserItems (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    },
    include: {
      items: {
        select: {
          amount: true,
          item: {
            select: {
              type: true,
              dimensions: true
            }
          }
        }
      }
    }
  })
    .then(user => {
      if (!user) {
        res.status(404).send('User not found');
      } else if (!user.items || user.items.length === 0) {
        res.status(404).send('Items not found');
      } else {
        res.send(user.items.map(item => { return { amount: item.amount, type: item.item.type, dimensions: item.item.dimensions }; }));
      }
    })
    .catch(err => {
      if (!req.userId.value || !req.userId.value.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid userId parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get items');
      }
    });
};

module.exports.getUserItem = function getUserItem (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    },
    include: {
      items: {
        select: {
          amount: true,
          item: {
            select: {
              type: true,
              dimensions: true
            }
          }
        },
        where: {
          itemId: { equals: parseInt(req.itemId.value) }
        }
      }
    }
  })
    .then(user => {
      if (!user) {
        res.status(404).send('User not found');
      } else if (!user.items || user.items.length === 0) {
        res.status(404).send('Item not found');
      } else {
        res.send({ amount: user.items[0].amount, type: user.items[0].item.type, dimensions: user.items[0].item.dimensions });
      }
    })
    .catch(err => {
      if ([req.userId.value, req.itemId.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get the item of the user.');
      }
    });
};

module.exports.postUserRating = async function postUserRating (req, res, next) {
  const authToken = req.cookies?.authToken;
  const ratingToBePublished = req.swagger.params.body.value;
  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

      if (!ratingToBePublished.reviewerId || !ratingToBePublished.receiverId || !req.swagger.params.userId.value) {
        res.status(400).send('Missing required attributes');
        return;
      }

      if (!ratingToBePublished.reviewerId.toString().match(/^\d+$/) || !req.swagger.params.userId.value.toString().match(/^\d+$/) || !ratingToBePublished.receiverId.toString().match(/^\d+$/)) {
        res.status(400).send('IDs must be integers');
        return;
      }

      if (parseInt(decoded.userId) !== parseInt(ratingToBePublished.reviewerId)) {
        res.status(403).send('Forbidden');
        return;
      }

      if ((parseInt(ratingToBePublished.reviewerId) === (parseInt(ratingToBePublished.receiverId)) && ((parseInt(ratingToBePublished.reviewerId) === parseInt(req.swagger.params.userId.value))))) {
        res.status(400).send('Can not rate yourself');
        return;
      }

      if (parseInt(ratingToBePublished.receiverId) !== parseInt(req.swagger.params.userId.value)) {
        res.status(400).send('Must match receiverId and userID');
        return;
      }
      const userRated = await prisma.user.findUnique({
        where: {
          id: parseInt(req.swagger.params.userId.value)
        }
      });

      if (!userRated) {
        res.status(404).send('The user to rate does not exist');
        return;
      }
      const errors = utils.user.checkRatingValidity(ratingToBePublished);
      if (errors.length > 0) {
        res.status(400).send(`Bad Request: ${errors[0]}`);
        return;
      }

      await prisma.rating.create({
        data: {
          title: ratingToBePublished.title,
          description: ratingToBePublished.description,
          rating: ratingToBePublished.rating,
          receiver: {
            connect: {
              id: parseInt(req.swagger.params.userId.value)
            }
          },
          reviewer: {
            connect: {
              id: parseInt(ratingToBePublished.reviewerId)
            }
          }
        }
      }).then(() => {
        res.status(201).send('Rating created successfully');
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

module.exports.deleteUserRating = async function deleteUserRating (req, res, next) {
  const authToken = req.cookies?.authToken;
  const ratingId = req.swagger.params.ratingId.value;
  if (authToken) {
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');
      if (!ratingId || !ratingId.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid ratingId. It must be an integer number');
        return;
      }
      const rating = await prisma.rating.findUnique({
        where: {
          id: parseInt(ratingId)
        }
      });
      if (rating) {
        if (parseInt(decoded.userId) !== parseInt(rating.reviewerId)) {
          res.status(403).send('Forbidden');
          return;
        }
      } else {
        res.status(400).send('No rating records found');
        return;
      }
      await prisma.user.update({
        where: {
          id: parseInt(rating.receiverId)
        },
        data: {
          ratings: {
            delete: {
              id: parseInt(ratingId)
            }
          }
        }
      }).then(() => {
        res.status(200).send('Rating deleted successfully');
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

module.exports.getUserRatings = function getUserRatings (req, res, next) {
  prisma.rating.findMany({
    skip: req.offset.value,
    take: req.limit.value,
    where: {
      OR: [
        { receiverId: { equals: parseInt(req.userId.value) } },
        { reviewerId: { equals: parseInt(req.userId.value) } }
      ]
    },
    select:
    {
      title: true,
      description: true,
      rating: true,
      reviewerId: true,
      receiverId: true
    }
  })
    .then(rating => {
      if (!rating || rating.length === 0) {
        res.status(404).send('Ratings not found');
      } else if (req.filter.value && !['all', 'received', 'given'].includes(req.filter.value.toLowerCase())) {
        res.status(400).send('Invalid filter parameter. It must be one of the following: all, received, given');
      } else {
        res.send(utils.user.filterRatings(rating, req));
      }
    })
    .catch(err => {
      if ([req.userId.value, req.offset.value, req.limit.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get ratings.');
      }
    });
};

module.exports.getUserRating = function getUserRating (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    },
    include: {
      ratings: {
        select: {
          title: true,
          description: true,
          rating: true,
          reviewerId: true,
          receiverId: true
        },
        where: {
          id: parseInt(req.ratingId.value)
        }
      }
    }
  })
    .then(user => {
      if (!user) {
        res.status(404).send('User not found');
      } else if (!user.ratings || user.ratings.length === 0) {
        res.status(404).send('Rating not found');
      } else {
        res.send(user.ratings[0]);
      }
    })
    .catch(err => {
      if ([req.userId.value, req.ratingId.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get the rating of the user.');
      }
    });
};

module.exports.getUserSpaces = function getUserSpaces (req, res, next) {
  prisma.space.findMany({
    skip: req.offset.value,
    take: req.limit.value,
    where: {
      ownerId: parseInt(req.userId.value)
    },
    include: {
      tags: true,
      images: true
    }
  })
    .then(spaces => {
      if (!spaces || spaces.length === 0) {
        res.status(404).send('Spaces not found');
      } else {
        res.send(spaces.map(space => utils.commons.excludeNulls(space)).reduce((acc, space) => {
          space.tags = space.tags?.map(tag => tag.tag);
          space.images = (space.images && space.images.length !== 0) ? [{ image: space.images[0].image.toString('base64'), mimetype: space.images[0].mimetype }] : [];
          return [...acc, space];
        }, []));
      }
    })
    .catch(err => {
      if (!req.userId.value || !req.userId.value.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid userId parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get items');
      }
    });
};

module.exports.getUserSpace = function getUserSpace (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    },
    include: {
      spaces: {
        where: {
          id: parseInt(req.spaceId.value)
        }
      }
    }
  })
    .then(users => {
      if (!users) {
        res.status(404).send('User not found');
      } else if (!users.spaces || users.spaces.length === 0) {
        res.status(404).send('Space not found');
      } else {
        res.send(users.spaces.map(space => utils.commons.excludeNulls(space))[0]);
      }
    })
    .catch(err => {
      if ([req.userId.value, req.spaceId.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get space');
      }
    });
};

module.exports.getUserRentals = function getUserRentals (req, res, next) {
  prisma.rental.findMany({
    skip: req.offset.value,
    take: req.limit.value,
    where: {
      renterId: parseInt(req.userId.value)
    }
  })
    .then(rentals => {
      if (!rentals || rentals.length === 0) {
        res.status(404).send('Rentals not found');
      } else {
        res.send(rentals.map(rental => utils.commons.excludeNulls(rental)));
      }
    })
    .catch(err => {
      if (!req.userId.value || !req.userId.value.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid userId parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get rentals.');
      }
    });
};

module.exports.getUserRental = function getUserRental (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    },
    include: {
      rentals: {
        select: {
          initialDate: true,
          finalDate: true,
          cost: true,
          type: true,
          meters: true,
          spaceId: true,
          renterId: true
        },
        where: {
          id: parseInt(req.rentalId.value)
        }
      }
    }
  })
    .then(user => {
      if (!user) {
        res.status(404).send('User not found');
      } else if (!user.rentals || user.rentals.length === 0) {
        res.status(404).send('Rental not found');
      } else {
        res.send(user.rentals[0]);
      }
    })
    .catch(err => {
      if ([req.userId.value, req.rentalId.value].some(s => s && !s.toString().match(/^\d+$/))) {
        res.status(400).send('Invalid parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get rental.');
      }
    });
};

module.exports.getUserAvatar = async function getUserAvatar (req, res, next) {
  await prisma.image.findUnique({
    where: {
      userId: req.userId.value
    }
  })
    .then(img => {
      if (!img) {
        res.status(404).send('No image found for this userdId');
      } else {
        res.send({ image: img.image.toString('base64'), mimetype: img.mimetype });
      }
    })
    .catch(err => {
      if (!req.userId.value || !req.userId.value.toString().match(/^\d+$/)) {
        res.status(400).send('Invalid userId parameter. It must be an integer number');
      } else {
        console.error(err);
        res.status(500).send('Server error: Could not get user avatar.');
      }
    });
};
