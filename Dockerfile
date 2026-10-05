# One image for both Quality Books services (Topic 7: environments).
# The command picks the service: see compose.yaml.

# Build stage: npm installs the production dependencies.
FROM node:24-alpine AS deps
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Runtime stage: only node runs the services, so the package managers that
# ship with the base image (npm, npx, yarn, corepack) and their own
# vulnerable dependencies are removed.
FROM node:24-alpine
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-* \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /srv
ENV NODE_ENV=production LOG_REQUESTS=true
COPY --from=deps /srv/node_modules ./node_modules
COPY package.json ./
COPY app ./app
COPY services ./services
USER node
CMD ["node", "app/src/server.js"]
