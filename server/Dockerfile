# northstar-inventory-hook — container build
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev

FROM base
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js ./

# Fly.io injects PORT; the server honours it (default 3000).
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://127.0.0.1:${PORT:-3000}/inventory/NS-1042 || exit 1

CMD ["node", "server.js"]
