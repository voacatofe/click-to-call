# 1. Dependências
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
RUN npm i -g pnpm && pnpm install --filter web --prod

# 2. Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Argumentos de build para injetar variáveis de ambiente no momento da construção
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ASTERISK_HOST
ARG NEXT_PUBLIC_ASTERISK_WSS_PORT
ARG NEXT_PUBLIC_AGENT_PASSWORD
ARG NEXT_PUBLIC_FORCE_PROTOCOL
ARG NEXT_PUBLIC_AGENT_ID
ARG NEXT_PUBLIC_ASTERISK_REALM
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Expor os argumentos como variáveis de ambiente para o processo de build do Next.js
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ASTERISK_HOST=$NEXT_PUBLIC_ASTERISK_HOST
ENV NEXT_PUBLIC_ASTERISK_WSS_PORT=$NEXT_PUBLIC_ASTERISK_WSS_PORT
ENV NEXT_PUBLIC_AGENT_PASSWORD=$NEXT_PUBLIC_AGENT_PASSWORD
ENV NEXT_PUBLIC_FORCE_PROTOCOL=$NEXT_PUBLIC_FORCE_PROTOCOL
ENV NEXT_PUBLIC_AGENT_ID=$NEXT_PUBLIC_AGENT_ID
ENV NEXT_PUBLIC_ASTERISK_REALM=$NEXT_PUBLIC_ASTERISK_REALM
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

COPY --from=deps /app/ .
# COPY . . <-- Removido para evitar copiar todo o contexto
COPY turbo.json turbo.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY apps/web/ ./apps/web/
RUN npm i -g pnpm && pnpm install && pnpm turbo run build --filter=web

# 3. Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar curl para health check
RUN apk add --no-cache curl

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia todos os manifestos do monorepo
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Instala TODAS as dependências de produção do monorepo
RUN npm i -g pnpm && pnpm install --prod

# Copia os arquivos da aplicação
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next

USER nextjs

EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"] 