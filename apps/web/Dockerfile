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
COPY . .
RUN npm i -g pnpm && pnpm turbo run build --filter=web

# 3. Runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
USER nextjs
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"] 