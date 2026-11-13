# Contexte de build : la racine du dépôt (docker build -f apps/web/Dockerfile .). NS-004.
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
# pnpm 12 : corepack ne sait pas le lancer, on l'installe avec npm (version lue dans package.json).
COPY package.json ./
RUN npm i -g "$(node -p "require('./package.json').packageManager.split('+')[0]")"
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile --filter @newstart/web...
COPY packages packages
COPY apps/web apps/web
RUN pnpm --filter @newstart/web build

FROM node:${NODE_VERSION}-alpine AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
# Sortie « standalone » : serveur + dépendances tracées ; les fichiers statiques sont à copier à part.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
