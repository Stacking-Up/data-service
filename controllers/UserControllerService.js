'use strict';

const utils = require('../utils');
const prisma = require('../prisma');

module.exports.getUsers = function getUsers (req, res, next) {
  prisma.user.findMany({
    skip: req.offset.value,
    take: req.limit.value
  })
    .then(users => {
      res.send(users.map(user => utils.excludeNulls(user)));
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get users');
    });
};

module.exports.getUser = function getUser (req, res, next) {
  prisma.user.findUnique({
    where: {
      id: parseInt(req.userId.value)
    }
  })
    .then(user => {
      if (!user) { res.status(404).send('User not found'); } else { res.send(utils.excludeNulls(user)); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get users');
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
          type: true,
          dimensions: true
        }
      }
    }
  })
    .then(user => {
      if (!user) { res.status(404).send("User not found"); }
      else if (!user.items) { res.status(404).send("Items not found"); }
      else { res.send(user.items); }      
   })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get users');
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
          type: true,
          dimensions: true
        },
        where: {
          id: parseInt(req.itemId.value)
        }
      }
    }
  })
    .then(user => {
      if (!user) { res.status(404).send("User not found"); }
      else if (!user.items || user.items.length === 0) { res.status(404).send("Item not found"); }
      else { res.send(user.items[0]); }      
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get users');
    });
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
      if (!rating) { res.status(404).send('Ratings not found'); }
      req.filter.value ? res.send(utils.filterRatings(rating, req)) : res.send(rating);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get ratings');
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
      if (!user) { res.status(404).send('User not found'); } else if (!user.ratings[0]) { res.status(404).send('Rating not found'); } else { res.send(user.ratings[0]); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get rating');
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
      image: true,
      tags: true
    }
  })
    .then(spaces => {
      !spaces ? res.status(404).send('Spaces not found') : res.send(spaces.map(space => utils.excludeNulls(space)));
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get spaces');
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
      if (!users) { res.status(404).send('User not found'); } else if (!users.spaces[0]) { res.status(404).send('Space not found'); } else { res.send(users.spaces.map(space => utils.excludeNulls(space))[0]); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get space');
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
      if (!rentals) { res.status(404).send('Rentals not found'); } else if (rentals.length === 0) { res.status(404).send('Rentals not found or non existing user with this Id.'); } else { res.send(rentals.map(rental => utils.excludeNulls(rental))); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get rentals.');
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
      if (!user) { res.status(404).send('User not found'); } else if (!user.rentals[0]) { res.status(404).send('Rental not found'); } else { res.send(user.rentals[0]); }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error: Could not get rental.');
    });
};
