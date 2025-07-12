# =============================================================================
# Dockerfile para o Frontend (Web) - Robusto e Otimizado
# =============================================================================

# --- 1. Estágio Base (Instala pnpm e turbo) ---
FROM node:18-alpine AS base
RUN npm i -g pnpm turbo

# --- 2. Estágio de Dependências (Instala TUDO, incluindo dev) ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# --- 3. Estágio de Build (Compila o código) ---
FROM base AS builder
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
COPY apps/web/ ./apps/web/
RUN pnpm turbo run build --filter=web

# --- 4. Estágio de Produção (Imagem final e limpa) ---
FROM base AS runner
WORKDIR /app

# Cria usuários e grupos para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos da instalação completa e remove devDependencies
COPY --from=deps /app/ .
RUN pnpm prune --prod

# Copia os artefatos do build
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/

# Define o usuário para o contêiner
USER nextjs

# Expõe a porta e define o comando de inicialização
EXPOSE 3000
CMD ["next", "start"] 