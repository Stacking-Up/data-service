#!/bin/sh

npx prisma generate
npx prisma migrate deploy

if [[ $NODE_ENV = "development" ]]
then
  echo "deploying prisma studio..."
  nohup npx prisma studio &

  echo "Done! deploying the app..."
  node index.js
else
  echo "Delpoying the app..."
  node index.js
fi
