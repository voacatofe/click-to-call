# =============================================================================
# Dockerfile para a API Backend - Robusto e Otimizado
# =============================================================================

# --- 1. Estágio de Dependências ---
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
# Usando --frozen-lockfile para garantir builds consistentes
RUN npm i -g pnpm && pnpm install --filter api --prod --frozen-lockfile

# --- 2. Estágio de Build ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/ .
COPY turbo.json turbo.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY apps/api/ ./apps/api/
# Otimizando a instalação e o build
# Inclui devDependencies para ter acesso ao 'tsc' (TypeScript Compiler)
RUN npm i -g pnpm turbo && pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=api

# --- 3. Estágio de Produção ---
FROM node:18-alpine AS runner
WORKDIR /app

# Instala SOMENTE as dependências de produção na imagem final
COPY --from=deps /app/ .
# Note que aqui usamos --prod, o que é correto para a imagem final
RUN npm i -g pnpm && pnpm install --prod --frozen-lockfile

# Copia os artefatos do build
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY package.json .
COPY apps/api/package.json ./apps/api/

# Instala o curl para o healthcheck
RUN apk add --no-cache curl

# Expõe a porta e define o comando de inicialização
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"] 