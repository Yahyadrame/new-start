# Contexte de build : la racine du dépôt (docker build -f apps/worker/Dockerfile .). NS-004.
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /repo
# pnpm 12 : corepack ne sait pas le lancer, on l'installe avec npm (version lue dans package.json).
COPY package.json ./
RUN npm i -g "$(node -p "require('./package.json').packageManager.split('+')[0]")"
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @newstart/worker...
COPY packages/config packages/config
COPY apps/worker apps/worker
RUN pnpm --filter @newstart/worker build \
 && pnpm --filter @newstart/worker deploy --prod --legacy /out

FROM node:${NODE_VERSION}-alpine AS run
ENV NODE_ENV=production HEARTBEAT_FILE=/app/run/alive
WORKDIR /app
RUN mkdir run && chown node:node run
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/worker/dist ./dist
COPY --from=build --chown=node:node /repo/apps/worker/package.json ./
USER node
# Pas de port HTTP : le worker touche HEARTBEAT_FILE toutes les 15 s, on vérifie qu'il est récent.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "process.exit(Date.now()-require('fs').statSync(process.env.HEARTBEAT_FILE).mtimeMs<60000?0:1)"
CMD ["node", "dist/main.js"]
