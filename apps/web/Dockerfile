# =============================================================================
# Dockerfile para o Frontend (Web) - Robusto e Otimizado
# =============================================================================

# --- 1. Estágio de Dependências ---
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
# Usando --frozen-lockfile para garantir builds consistentes
RUN npm i -g pnpm && pnpm install --filter web --prod --frozen-lockfile

# --- 2. Estágio de Build ---
FROM node:18-alpine AS builder
# Argumentos de Build para variáveis NEXT_PUBLIC
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_AGENT_PASSWORD
ARG NEXT_PUBLIC_EASYPANEL_HOST
ARG NEXT_PUBLIC_WEBSOCKET_PATH
ARG NEXT_PUBLIC_ASTERISK_REALM
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

WORKDIR /app
COPY --from=deps /app/ .
COPY turbo.json turbo.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY apps/web/ ./apps/web/
# Otimizando a instalação e o build
# Inclui devDependencies para as ferramentas de build do Next.js
RUN npm i -g pnpm turbo && pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=web

# --- 3. Estágio de Produção ---
FROM node:18-alpine AS runner
WORKDIR /app

# Cria usuários e grupos para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia SOMENTE as dependências de produção
COPY --from=deps /app/ .
RUN npm i -g pnpm && pnpm install --prod --frozen-lockfile

# Copia os artefatos do build
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/

# Define o usuário para o contêiner
USER nextjs

# Expõe a porta e define o comando de inicialização
EXPOSE 3000
CMD ["next", "start"] 