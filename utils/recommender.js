'use strict';

const { TfIdf } = require('natural');
const Vector = require('vector-object');

module.exports.spaceModel = [];
module.exports.trainSpaceModel = (spaces) => {
    if (spaces && spaces.length > 0) {
      let formattedSpaces = _formatSpaces(spaces);
      let spacesVectors = _createVectorFromSpaces(formattedSpaces);
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
    })
}

const _createVectorFromSpaces = (spaces) => {
    const tfidf = new TfIdf();

    spaces.forEach(space => {
        tfidf.addDocument(space.content);
    });
    
    const spacesVectors = [];

    for(let i = 0; i < spaces.length; i++) {
        const processedSpace = spaces[i];
        const obj = {};

        const items = tfidf.listTerms(i);

        for(let item of items) {
            obj[item.term] = item.tfidf;
        }

        const spaceVector = {
            id: processedSpace.id,
            vector: new Vector(obj)
        }

        spacesVectors.push(spaceVector);	
    }

    return spacesVectors;
}

const _calcSimilarities = (spacesVectors) => {
    const MAX_SIMILAR = 15; 
    const MIN_SCORE = 0.2;
    const data = {};
  
    for (let spaceVector of spacesVectors) { 
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
}