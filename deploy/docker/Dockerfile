FROM node:22-bookworm-slim AS base
WORKDIR /usr/server/app
ENV PATH /usr/server/app/node_modules/.bin:$PATH

# STAGE 2 - install dependencies
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# STAGE 3 - build the app
FROM base AS build
ENV NODE_ENV production
COPY --from=deps /usr/server/app/node_modules ./node_modules
COPY . .
RUN yarn build

# STAGE 4 - production image
FROM node:22-bookworm-slim AS final
WORKDIR /usr/server/app
ENV NODE_ENV production
COPY --from=deps /usr/server/app/node_modules ./node_modules
COPY --from=build /usr/server/app/build ./build
COPY --from=build /usr/server/app/public ./public
COPY package.json yarn.lock ./
CMD ["yarn", "start"]