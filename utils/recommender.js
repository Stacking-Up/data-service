'use strict';

const { TfIdf } = require('natural');
const Vector = require('vector-object');

module.exports.spaceModel = [];
module.exports.trainSpaceModel = (spaces) => {
  if (spaces && spaces.length > 0) {
    const formattedSpaces = _formatSpaces(spaces);
    const spacesVectors = _createVectorFromSpaces(formattedSpaces);
    module.exports.spaceModel = _calcSimilarities(spacesVectors);
  }
};

const _formatSpaces = (spaces) => {
  return spaces.map(space => {
    return {
      id: space.id,
      content: `${space.name} - ${space.description} - ${space.shared ? 'Shared' : 'Private'}`,
      tags: space.tags,
      location: space.location
    };
  });
};

const _createVectorFromSpaces = (spaces) => {
  const tfidf = new TfIdf();

  spaces.forEach(space => {
    tfidf.addDocument(space.content);
  });

  const spacesVectors = [];

  for (let i = 0; i < spaces.length; i++) {
    const processedSpace = spaces[i];
    const obj = {};

    const items = tfidf.listTerms(i);

    for (const item of items) {
      obj[item.term] = item.tfidf;
    }

    const spaceVector = {
      id: processedSpace.id,
      vector: new Vector(obj)
    };

    spacesVectors.push(spaceVector);
  }

  return spacesVectors;
};

const _calcSimilarities = (spacesVectors) => {
  const MAX_SIMILAR = 15;
  const MIN_SCORE = 0.0;
  const data = {};

  for (const spaceVector of spacesVectors) {
    data[spaceVector.id] = [];
  }

  for (let i = 0; i < spacesVectors.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const idi = spacesVectors[i].id;
      const vi = spacesVectors[i].vector;
      const idj = spacesVectors[j].id;
      const vj = spacesVectors[j].vector;
      const similarity = vi.getCosineSimilarity(vj);

      if (similarity > MIN_SCORE) {
        data[idi].push({ id: idj, score: similarity });
        data[idj].push({ id: idi, score: similarity });
      }
    }
  }

  Object.keys(data).forEach(id => {
    data[id].sort((a, b) => b.score - a.score);

    if (data[id].length > MAX_SIMILAR) {
      data[id] = data[id].slice(0, MAX_SIMILAR);
    }
  });

  return data;
};

module.exports.dictItemsTags = {
  APPLIANCES: ['FLOOR_1', 'BASEMENT', 'GARAGE', 'STORAGE_ROOM', 'INDUSTRIAL_WAREHOUSE', 'ELEVATOR', 'DRY',
    'SECURITY_ALARM', 'VIDEO_MONITORING', 'FIRE_ALARM', 'GROUND_FLOOR', 'SOCKET', 'INDOOR', 'MEDIUM_WIDTH_ACCESS', 'WIDE_ACCESS'],
  ELECTRONICS: ['DRY', 'COLD', 'SECURITY_ALARM', 'VIDEO_MONITORING', 'FIRE_ALARM', 'SOCKET', 'INDOOR', 'NARROW_ACCESS'],
  CLOTHES: ['HOUSE_ROOM', 'FLAT_ROOM', 'DRY', 'INDOOR', 'NARROW_ACCESS'],
  FURNITURE: ['FLOOR_1', 'BASEMENT', 'GARAGE', 'STORAGE_ROOM', 'INDUSTRIAL_WAREHOUSE', 'ELEVATOR', 'DRY', 'SECURITY_ALARM',
    'VIDEO_MONITORING', 'FIRE_ALARM', 'INDOOR', 'MEDIUM_WIDTH_ACCESS', 'WIDE_ACCESS'],
  DIYs: ['BASEMENT', 'GARAGE', 'STORAGE_ROOM', 'INDUSTRIAL_WAREHOUSE', 'DRY', 'SECURITY_ALARM', 'INDOOR', 'NARROW_ACCESS'],
  OTHER: ['SECURITY_ALARM', 'VIDEO_MONITORING', 'FIRE_ALARM', 'OUTDOOR']
};

module.exports.scoreTags = (selectedTags, spaceTags) => {
  const intersection = selectedTags.filter(tag => spaceTags.includes(tag));
  return intersection.length / selectedTags.length;
};

const _deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

module.exports.calculaDistanceBtw2Points = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = _deg2rad(lat2 - lat1);
  const dLon = _deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(_deg2rad(lat1)) * Math.cos(_deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};
