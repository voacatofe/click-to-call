# 1. Dependências
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
RUN npm i -g pnpm && pnpm install --filter api --prod

# 2. Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/ . 
COPY turbo.json turbo.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY apps/api/ ./apps/api/
RUN npm i -g pnpm && pnpm install && pnpm turbo run build --filter=api

# 3. Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar curl para health check
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV DOCKER_ENV=true

# Copia todos os manifestos do monorepo
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Instala TODAS as dependências de produção do monorepo
RUN npm i -g pnpm && pnpm install --prod

# Copia o código compilado da API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"] 