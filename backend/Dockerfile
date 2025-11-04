FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

RUN npx tsc -p tsconfig.json --pretty false --noEmitOnError false

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev

EXPOSE 4000
CMD ["node", "dist/server.js"]
