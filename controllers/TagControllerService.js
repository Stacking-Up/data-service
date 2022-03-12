'use strict';

module.exports.getTags = function getTags (req, res, next) {
    const tags = require('@prisma/client')?.TagEnum ? Object.values(require('@prisma/client').TagEnum) : undefined;

    if(tags !== undefined) {
        res.status(200).send(tags);
    }
    else {
        res.status(500).send('Internal Server Error');
    }
};