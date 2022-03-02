
FROM node:16.13.0-alpine3.14

COPY . .

RUN npm install --only=prod

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

CMD [ "node", "index.js" ]