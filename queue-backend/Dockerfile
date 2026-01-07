FROM node:20-alpine AS base

###################
# BUILD DEPENDENCIES
###################
FROM base As dependencies

RUN apk add --no-cache libc6-compat

ENV NODE_ENV build

WORKDIR /usr/src/app

COPY queue-backend/package.json queue-backend/yarn.lock* queue-backend/package-lock.json* queue-backend/pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


#######################
# BUILD FOR PRODUCTION
#######################
FROM base As build

WORKDIR /usr/src/app

ENV NODE_ENV build

COPY --chown=node:node ./queue-backend/package.json ./
COPY --chown=node:node ./queue-backend/yarn.lock ./

COPY --chown=node:node --from=dependencies /usr/src/app/node_modules ./node_modules

COPY --chown=node:node ./queue-backend .

RUN yarn run build

RUN yarn cache clean


###################
# PRODUCTION RUNTIME
###################
FROM base As production

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./

COPY --chown=node:node queue-backend/package.json ./
COPY --chown=node:node queue-backend/tsconfig.json ./
COPY --chown=node:node queue-backend/scripts ./scripts

EXPOSE 9999

ENV HOSTNAME "0.0.0.0"

USER node

CMD [ "node", "src/main.js" ]