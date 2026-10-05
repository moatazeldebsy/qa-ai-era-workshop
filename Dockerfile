# One image for both Quality Books services (Topic 7: environments).
# The command picks the service: see compose.yaml.
FROM node:24-alpine
WORKDIR /srv
ENV NODE_ENV=production LOG_REQUESTS=true
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY app ./app
COPY services ./services
USER node
CMD ["node", "app/src/server.js"]
