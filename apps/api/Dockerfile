# =============================================================================
# Dockerfile para a API Backend - Robusto e Otimizado
# =============================================================================

# --- 1. Estágio Base (Instala pnpm e turbo) ---
FROM node:18-alpine AS base
RUN npm i -g pnpm turbo

# --- 2. Estágio de Dependências (Instala TUDO, incluindo dev) ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# --- 3. Estágio de Build (Compila o código) ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ .
COPY turbo.json turbo.json
COPY apps/api/ ./apps/api/
RUN pnpm turbo run build --filter=api

# --- 4. Estágio de Produção (Imagem final e limpa) ---
FROM base AS runner
WORKDIR /app

# Copia apenas os arquivos necessários da instalação completa
COPY --from=deps /app/ .
# Remove as dependências de desenvolvimento, deixando só as de produção
RUN pnpm prune --prod

# Copia os artefatos do build
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY package.json .
COPY apps/api/package.json ./apps/api/

# Instala o curl para o healthcheck
RUN apk add --no-cache curl

# Expõe a porta e define o comando de inicialização
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"] 