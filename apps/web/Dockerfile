# 1. Dependências
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN npm i -g pnpm && pnpm install --filter web --prod

# 2. Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/ .
# COPY . . <-- Removido para evitar copiar todo o contexto
COPY turbo.json turbo.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY apps/web/ ./apps/web/
RUN npm i -g pnpm && pnpm install && pnpm turbo run build --filter=web

# 3. Runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copia todos os manifestos do monorepo
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Instala TODAS as dependências de produção do monorepo
RUN npm i -g pnpm && pnpm install --prod

# Copia os artefatos de build da web
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next

USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter web start"] 