# ---------- Base Stage ----------
FROM node:22-bookworm-slim AS base
WORKDIR /usr/server/app
ENV PATH=/usr/server/app/node_modules/.bin:$PATH

# Enable Corepack + Yarn 4
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# ---------- Build ----------
FROM base AS build
COPY --from=deps /usr/server/app/node_modules ./node_modules
COPY . .
RUN yarn build

# ---------- Prune ----------
FROM base AS prune
ENV NODE_ENV=production
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable --mode=skip-build

# ---------- Final ----------
FROM node:22-bookworm-slim AS final
WORKDIR /usr/server/app
ENV NODE_ENV=production
ENV PORT=3000

# Enable Yarn 4 runtime
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Copy dependencies and build output
COPY --from=prune /usr/server/app/node_modules ./node_modules
COPY --from=build /usr/server/app/build ./build
COPY --from=build /usr/server/app/public ./public
COPY --from=build /usr/server/app/server.js ./server.js
COPY package.json yarn.lock .yarnrc.yml ./

EXPOSE 3000
CMD ["node", "server.js"]
