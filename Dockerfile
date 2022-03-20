
FROM node:16.13.0-alpine3.14

WORKDIR /opt/app

COPY . .
COPY prisma/schemas/models.prisma prisma/schema.prisma
RUN rm -rf prisma/schemas

RUN npm install --only=prod

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT

RUN chmod +x deploy.sh
RUN dos2unix deploy.sh
CMD ["./deploy.sh"]
