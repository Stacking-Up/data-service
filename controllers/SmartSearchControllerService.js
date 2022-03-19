'use strict';

const utils = require('../utils');
const prisma = require('../prisma');
const jwt = require('jsonwebtoken');

module.exports.getSpaces = async function getSpaces(req, res, next) {
    const authToken = req.cookies?.authToken;
    const items = req.swagger.params.items.value;

    if (!items || items.length === 0) {
        res.status(400).send('No items provided');
        return;
    }

    if (authToken) {
        // Reccomendations based on tfidf
        try {
            const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'stackingupsecretlocal');

            await prisma.rental.findMany({
                where: {
                    userId: decoded.id
                },
                include: {
                    space: true
                }
            }).then(rentals => {
                if(!rentals || rentals.length === 0) {
                    res.status(200).send([]);
                } else {
                    let recommended = rentals.flatMap(rental => utils.smartSearch.spaceModel[rental.space.id]);
                    res.status(200).send(recommended);
                }
            }).catch(err => {
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
        //TODO reccomenaation based on tags and location
        res.status(401).send('Unauthorized');
    }
};

module.exports.postTrainSpaces = async function postTrainSpaces(req, res, next) {
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
                utils.smartSearch.trainSpaceModel(spaces);
                res.status(200).send('Space model trained');
            }).catch(err => {
                console.error(err);
                res.status(500).send(err);
                return;
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
}
