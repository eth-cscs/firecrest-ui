# STAGE 1 - base node image
FROM node:21-bullseye-slim as base

# STAGE 2 - install all node_modules, including dev dependencies
FROM base as deps
# set working directory
WORKDIR /usr/server/app
# add metadata files
ADD package.json yarn.lock ./
# install dependecies
RUN yarn install

# STAGE 3 - setup production node_modules
FROM base as production-deps
# set for base and all layer that inherit from it
ENV NODE_ENV production
# set working directory
WORKDIR /usr/server/app
# copy node_modules
COPY --from=deps /usr/server/app/node_modules /usr/server/app/node_modules
# add metadata files
ADD package.json yarn.lock

# STAGE 4 - build the app
FROM base as build
# set for base and all layer that inherit from it
ENV NODE_ENV production
# set working directory
WORKDIR /usr/server/app
# copy node_modules
COPY --from=deps /usr/server/app/node_modules /usr/server/app/node_modules
# add all files
ADD . .
# build the code/app
RUN yarn run build

# STAGE 5 - finally, build the production image with minimal footprint
FROM base
# set for base and all layer that inherit from it
ENV NODE_ENV production
# set working directory
WORKDIR /usr/server/app
# copy production node_modules
COPY --from=production-deps /usr/server/app/node_modules /usr/server/app/node_modules
# copy build and public files from build image
COPY --from=build /usr/server/app/build /usr/server/app/build
COPY --from=build /usr/server/app/public /usr/server/app/public
# add all files
ADD . .
# start the application
CMD ["yarn", "start"]