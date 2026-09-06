# syntax=docker/dockerfile:1

# Imagem Debian slim (e não Alpine) de propósito: o sharp, usado pelo Next para
# otimizar as fotos, tem binários prontos para glibc e evita a compilação nativa
# que o musl exigiria.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `prisma generate` só lê o schema, mas a config exige a variável presente.
# Esta URL é descartável e nunca chega ao servidor.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate

# Nenhuma outra variável é necessária: toda a configuração da aplicação é lida
# em runtime, então a mesma imagem serve a qualquer ambiente.
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DIRETORIO_DADOS=/app/dados

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Ferramentas de migração isoladas do bundle da aplicação: o servidor não
# precisa da CLI do Prisma, só o entrypoint precisa.
# A versão sai do próprio package.json, para CLI e cliente nunca divergirem.
COPY --from=builder /app/package.json /tmp/package.json
RUN VERSAO=$(node -p "require('/tmp/package.json').dependencies.prisma.replace(/[^0-9.]/g,'')") \
 && mkdir -p /opt/migracoes && cd /opt/migracoes \
 && npm init -y > /dev/null \
 && npm install --omit=dev --no-audit --no-fund "prisma@${VERSAO}" dotenv > /dev/null \
 && npm cache clean --force > /dev/null 2>&1 \
 && rm /tmp/package.json
COPY --from=builder /app/prisma /opt/migracoes/prisma
COPY --from=builder /app/prisma.config.ts /opt/migracoes/prisma.config.ts

COPY --from=builder /app/public ./public
# O build standalone já traz só as dependências que o servidor usa.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Fotos e PDFs continuam em disco mesmo com banco: aqui é o ponto do volume.
RUN mkdir -p /app/dados/uploads && chown -R nextjs:nodejs /app/dados

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/saude').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
