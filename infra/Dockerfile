FROM node:24.22.0-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps ./apps
COPY packages ./packages
COPY tsconfig.json tsconfig.base.json ./

RUN npm ci && npm run build && chown -R node:node /app

USER node

ENV APP_MODE=local
ENV HOST=127.0.0.1
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
