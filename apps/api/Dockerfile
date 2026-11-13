# Contexte de build : la racine du dépôt (docker build -f apps/api/Dockerfile .). NS-004.
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /repo
# pnpm 12 : corepack ne sait pas le lancer, on l'installe avec npm (version lue dans package.json).
COPY package.json ./
RUN npm i -g "$(node -p "require('./package.json').packageManager.split('+')[0]")"
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @newstart/api...
COPY packages/config packages/config
COPY apps/api apps/api
RUN pnpm --filter @newstart/api build \
 && pnpm --filter @newstart/api deploy --prod --legacy /out

FROM node:${NODE_VERSION}-alpine AS run
ENV NODE_ENV=production PORT=4000
WORKDIR /app
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --from=build --chown=node:node /repo/apps/api/package.json ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health/live').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "dist/main.js"]
