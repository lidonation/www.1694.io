FROM node:20-alpine AS base

###################
# BUILD DEPENDENCIES
###################
FROM base As dependencies

RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

COPY backend/package.json backend/yarn.lock* backend/package-lock.json* backend/pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --production; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


###################
# BUILD FOR PRODUCTION
###################
FROM base As build

WORKDIR /usr/src/app

COPY --chown=node:node ./backend/package.json ./
COPY --chown=node:node ./backend/yarn.lock ./

COPY --chown=node:node --from=dependencies /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN yarn build

ENV NODE_ENV production

RUN yarn cache clean

USER node


###################
# PRODUCTION RUNTIME
###################
FROM base As production

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

COPY --chown=node:node backend/package.json ./dist/
COPY --chown=node:node backend/yarn.lock ./dist/

EXPOSE 8000

ENV HOSTNAME "0.0.0.0"

CMD [ "node", "dist/main.js" ]