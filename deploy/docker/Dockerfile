# Base stage with Node
FROM node:22-bookworm-slim AS base
WORKDIR /usr/server/app
ENV PATH=/usr/server/app/node_modules/.bin:$PATH

# Enable Corepack and install Yarn 4 globally
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Deps stage: install dependencies
FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --frozen-lockfile

# Build stage
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /usr/server/app/node_modules ./node_modules
COPY . .
RUN yarn build

# Final production image
FROM node:22-bookworm-slim AS final
WORKDIR /usr/server/app
ENV NODE_ENV=production
COPY --from=deps /usr/server/app/node_modules ./node_modules
COPY --from=build /usr/server/app/build ./build
COPY --from=build /usr/server/app/public ./public
COPY package.json yarn.lock .yarnrc.yml ./
CMD ["yarn", "start"]