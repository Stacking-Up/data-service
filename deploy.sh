#!/bin/sh

npx prisma generate --schema=./prisma/schemas/models.prisma
npx prisma migrate deploy --schema=./prisma/schemas/models.prisma

if [[ $NODE_ENV = "development" ]]
then
  echo "deploying prisma studio..."
  nohup npx prisma studio --schema=./prisma/schemas/models.prisma &

  echo "Done! deploying the app..."
  node index.js
else
  echo "Delpoying the app..."
  node index.js
fi
