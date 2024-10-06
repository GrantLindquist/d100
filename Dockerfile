FROM node:18 AS builder

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:18-slim AS runner

COPY --from=builder ./ ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
