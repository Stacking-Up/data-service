[![Coverage Status](https://coveralls.io/repos/github/Stacking-Up/data-service/badge.svg?branch=main)](https://coveralls.io/github/Stacking-Up/data-service?branch=main)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-green.svg)](https://conventionalcommits.org)
[![Node.js CI](https://github.com/Stacking-Up/data-service/actions/workflows/nodejs.yaml/badge.svg)](https://github.com/Stacking-Up/data-service/actions/workflows/nodejs.yaml)

## START DEVELOPMENT

Clone infrastructure project
```bash
git clone https://github.com/Stacking-Up/infrastructure.git
```

Run docker-compose
```bash
docker-compose -f docker/docker-compose-local.yaml --env-file .env.local up -d
```
Stop data-service and start local:
```bash
npm start
```

## SCHEMA DOCS

You can access schema api-reference by running:
```bash
npm run schema-docs
```
You can watch the schema diagram generated at `prisma/docs/diagram.png`