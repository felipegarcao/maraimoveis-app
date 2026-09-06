#!/bin/sh
set -e

# Com banco configurado, as migrations são aplicadas antes de aceitar tráfego.
# Sem DATABASE_URL a aplicação usa arquivos JSON e não há o que migrar.
if [ -n "$DATABASE_URL" ]; then
  echo "[entrypoint] aplicando migrations do banco..."
  cd /opt/migracoes && ./node_modules/.bin/prisma migrate deploy
  cd /app
fi

exec "$@"
