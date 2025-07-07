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
COPY . .
RUN npm i -g pnpm && pnpm turbo run build --filter=api

# 3. Runner
FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["node", "dist/index.js"] 