# Deploy na VPS — maraimoveis.felipesyste.com.br

Passo a passo completo para colocar o **Mara Imóveis** no ar em uma VPS Linux
(Ubuntu/Debian) usando **Docker** para a aplicação e **nginx** no host como
proxy reverso, com HTTPS via Let's Encrypt.

Arquitetura final:

```
Internet ──▶ nginx (host, portas 80/443)  ──▶ 127.0.0.1:3102 ──▶ container mara-imoveis (porta 3000)
             maraimoveis.felipesyste.com.br                          │
                                                                     ├─ volume  mara-imoveis_mara-arquivos  (fotos e PDFs)
                                                                     └─ rede    ${REDE_BANCO}  ──▶ PostgreSQL
```

O container **não é publicado na internet**: ele escuta apenas em `127.0.0.1:3102`.
Quem atende o domínio é o nginx do host.

---

## 0. Pré-requisitos

- VPS com Ubuntu 22.04/24.04 (ou Debian 12) e acesso `root`/`sudo`.
- Portas **80** e **443** liberadas no firewall e no painel do provedor.
- **DNS já apontando**: registro `A` de `maraimoveis.felipesyste.com.br` para o IP da VPS.
  Confira antes de continuar — o certificado SSL depende disso:

  ```bash
  dig +short maraimoveis.felipesyste.com.br
  # deve responder o IP da sua VPS
  ```

- Um **PostgreSQL** acessível (pode ser o que já roda na VPS em container — ver passo 4).

---

## 1. Instalar Docker e nginx

```bash
sudo apt update && sudo apt upgrade -y

# Docker Engine + plugin do compose (repositório oficial)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER      # opcional: usar docker sem sudo
newgrp docker                      # aplica o grupo na sessão atual

# nginx e certbot
sudo apt install -y nginx certbot python3-certbot-nginx git

# conferir
docker --version && docker compose version && nginx -v
```

Se usar UFW:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 2. Clonar o projeto

```bash
sudo mkdir -p /opt/apps && sudo chown $USER:$USER /opt/apps
cd /opt/apps
git clone <URL-DO-SEU-REPOSITORIO> mara-imoveis
cd mara-imoveis
```

---

## 3. Configurar o `.env`

Toda a configuração é lida **em runtime** — mudar o `.env` exige apenas
reiniciar o container, nunca reconstruir a imagem.

```bash
cp .env.example .env
openssl rand -base64 32     # copie o resultado para SESSAO_SECRET
nano .env
```

Preencha assim (ajuste os valores em destaque):

```dotenv
# Sessão — troque pelo valor gerado com openssl acima
SESSAO_SECRET=<cole-o-segredo-gerado>

# Administrador criado no PRIMEIRO start (ver aviso no passo 7)
ADMIN_EMAIL=seu-email@dominio.com.br
ADMIN_SENHA=<senha-forte>
ADMIN_NOME=Administrador

# Banco — o host é o NOME DO CONTAINER do Postgres (passo 4)
DATABASE_URL=postgresql://mara:<senha-do-banco>@<container-postgres>:5432/mara_imoveis
REDE_BANCO=<rede-docker-do-postgres>

# Contato
WHATSAPP=5518997943842
RESEND_API_KEY=<sua-chave-resend>
EMAIL_DESTINO_CONTATO=contato@felipesystem.com.br
EMAIL_REMETENTE="Mara Imóveis <contato@felipesystem.com.br>"

# Infra
PORTA_HOST=3102
DIRETORIO_DADOS=/app/dados

# Vazio = sobe SEM dados de exemplo (o correto em produção)
DADOS_DEMONSTRACAO=
```

Proteja o arquivo — ele guarda segredos:

```bash
chmod 600 .env
```

> **Sem `RESEND_API_KEY`** a aplicação continua funcionando: o lead é salvo no
> painel e o e-mail apenas aparece no log do container.

---

## 4. Preparar o banco de dados

### Opção A — usar um PostgreSQL que já roda em container na VPS

1. Descubra o nome do container e a rede dele:

   ```bash
   docker ps --format '{{.Names}}\t{{.Image}}' | grep -i postgres

   docker inspect <container-postgres> \
     -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}'
   ```

   O primeiro comando dá o valor do **host** em `DATABASE_URL`; o segundo, o
   valor de **`REDE_BANCO`**.

2. Crie o usuário e o banco da aplicação:

   ```bash
   docker exec -it <container-postgres> psql -U postgres -c \
     "CREATE USER mara WITH PASSWORD '<senha-do-banco>';"

   docker exec -it <container-postgres> psql -U postgres -c \
     "CREATE DATABASE mara_imoveis OWNER mara;"
   ```

3. Ajuste `DATABASE_URL` e `REDE_BANCO` no `.env` com esses valores.

### Opção B — subir um PostgreSQL dedicado para a aplicação

Crie o arquivo `docker-compose.override.yml` na raiz do projeto:

```yaml
services:
  db:
    image: postgres:17-alpine
    container_name: mara-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: mara
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?defina no .env}
      POSTGRES_DB: mara_imoveis
    volumes:
      - mara-postgres:/var/lib/postgresql/data
    networks:
      - padrao
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mara -d mara_imoveis"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    depends_on:
      db:
        condition: service_healthy
    networks:
      - padrao

volumes:
  mara-postgres:
```

E no `.env`:

```dotenv
POSTGRES_PASSWORD=<senha-do-banco>
DATABASE_URL=postgresql://mara:<senha-do-banco>@mara-db:5432/mara_imoveis
```

> Nesta opção a rede externa `banco` do `docker-compose.yml` deixa de ser usada
> pelo app, mas o compose ainda a exige. Ou aponte `REDE_BANCO` para uma rede
> externa existente, ou remova o bloco `networks: banco` do `docker-compose.yml`.

### Sem banco?

Deixando `DATABASE_URL` **vazio**, a aplicação cai para arquivos JSON dentro do
volume. Serve para um teste rápido, não para produção.

---

## 5. Subir a aplicação

```bash
cd /opt/apps/mara-imoveis
docker compose up -d --build
```

O build leva alguns minutos na primeira vez. O `entrypoint` aplica as migrations
do Prisma (`prisma migrate deploy`) automaticamente antes de aceitar tráfego.

Acompanhe e valide:

```bash
docker compose ps                    # STATUS deve virar "healthy" em ~25s
docker compose logs -f app           # Ctrl+C para sair

curl -i http://127.0.0.1:3102/api/saude
# HTTP/1.1 200 OK  →  {"ok":true,"servico":"mara-imoveis",...}
```

Só avance para o nginx depois que esse `curl` responder **200**.

---

## 6. Configurar o nginx

Crie o site:

```bash
sudo nano /etc/nginx/sites-available/maraimoveis
```

Conteúdo:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name maraimoveis.felipesyste.com.br;

    # Upload de fotos dos imóveis (limite do app: 5 MB por foto)
    client_max_body_size 12M;

    access_log /var/log/nginx/maraimoveis.access.log;
    error_log  /var/log/nginx/maraimoveis.error.log;

    location / {
        proxy_pass         http://127.0.0.1:3102;
        proxy_http_version 1.1;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Forwarded-Host  $host;

        # Streaming das respostas do Next (RSC/Server Actions)
        proxy_buffering    off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

> `X-Forwarded-Proto` e `X-Forwarded-Host` **não são opcionais**: são eles que
> fazem o link do imóvel no e-mail de lead sair com o domínio e o protocolo
> corretos. `client_max_body_size` menor que 12M quebra o upload de fotos.

Ative e recarregue:

```bash
sudo ln -s /etc/nginx/sites-available/maraimoveis /etc/nginx/sites-enabled/
sudo nginx -t          # deve dizer "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

Teste em HTTP antes do SSL:

```bash
curl -I http://maraimoveis.felipesyste.com.br/api/saude
```

---

## 7. HTTPS com Let's Encrypt

```bash
sudo certbot --nginx -d maraimoveis.felipesyste.com.br
```

O certbot pede um e-mail, aceita os termos e oferece redirecionar HTTP → HTTPS:
**escolha redirecionar**. Ele reescreve o `server` acima adicionando o bloco 443
e o `listen 80` com redirect.

A renovação automática já vem com o pacote. Confira:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

Valide o site:

```bash
curl -I https://maraimoveis.felipesyste.com.br/api/saude
```

Abra no navegador:

| Área | URL |
| --- | --- |
| Site público | `https://maraimoveis.felipesyste.com.br` |
| Painel administrativo | `https://maraimoveis.felipesyste.com.br/login` |
| Portal do inquilino | `https://maraimoveis.felipesyste.com.br/portal/login` |

Entre no painel com o `ADMIN_EMAIL` / `ADMIN_SENHA` do `.env`.

> ⚠️ **`ADMIN_EMAIL` e `ADMIN_SENHA` valem apenas no primeiro start**, quando o
> usuário é criado no banco. Alterar essas variáveis depois **não muda** o
> usuário já gravado — troque a senha pelo próprio painel.

> O cookie de sessão é marcado `secure` em produção: o login **só funciona sob
> HTTPS**. Se algo falhar no login, confirme que o passo 7 foi concluído.

---

## 8. Operação do dia a dia

Todos os comandos a partir de `/opt/apps/mara-imoveis`.

```bash
docker compose logs -f app          # acompanhar logs
docker compose ps                   # estado e health
docker compose restart app          # aplicar mudança no .env
docker compose stop / start         # parar e voltar

# atualizar a aplicação após alterações no repositório
git pull
docker compose up -d --build
docker image prune -f               # limpar imagens antigas
```

### Backup

Os arquivos enviados (fotos dos imóveis e PDFs dos contratos) ficam no volume
`mara-imoveis_mara-arquivos`; o restante dos dados fica no PostgreSQL. **Faça os
dois.**

```bash
# 1) arquivos
docker run --rm -v mara-imoveis_mara-arquivos:/dados -v "$PWD":/backup alpine \
  tar czf /backup/mara-arquivos-$(date +%F).tar.gz -C /dados .

# 2) banco
docker exec <container-postgres> pg_dump -U mara -d mara_imoveis \
  | gzip > mara-banco-$(date +%F).sql.gz
```

Restauração:

```bash
# arquivos
docker run --rm -v mara-imoveis_mara-arquivos:/dados -v "$PWD":/backup alpine \
  sh -c "rm -rf /dados/* && tar xzf /backup/mara-arquivos-AAAA-MM-DD.tar.gz -C /dados"

# banco
gunzip -c mara-banco-AAAA-MM-DD.sql.gz \
  | docker exec -i <container-postgres> psql -U mara -d mara_imoveis
```

Agendar backup diário às 3h (`crontab -e`):

```cron
0 3 * * * cd /opt/apps/mara-imoveis && docker run --rm -v mara-imoveis_mara-arquivos:/dados -v /opt/backups:/backup alpine tar czf /backup/mara-arquivos-$(date +\%F).tar.gz -C /dados .
```

> `docker compose down` **preserva** o volume.
> `docker compose down -v` **apaga tudo** — fotos e PDFs inclusive.

---

## 9. Problemas comuns

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| `502 Bad Gateway` no nginx | Container fora do ar ou porta divergente | `docker compose ps`; confira se `PORTA_HOST` do `.env` bate com o `proxy_pass` |
| Container reinicia em loop | Migration falhou (banco inacessível) | `docker compose logs app`; verifique `DATABASE_URL` e `REDE_BANCO` |
| `network ... not found` no `up` | `REDE_BANCO` aponta para rede inexistente | `docker network ls` e corrija o `.env` |
| Login não persiste | Acesso por HTTP puro | Conclua o passo 7 — o cookie é `secure` em produção |
| `413 Request Entity Too Large` | `client_max_body_size` baixo | Deixe em `12M` no bloco `server` e recarregue o nginx |
| Certbot falha na validação | DNS ainda não propagou ou porta 80 fechada | `dig +short maraimoveis.felipesyste.com.br`; libere a 80 |
| Foto enviada some após redeploy | Volume removido | Nunca use `down -v`; restaure o backup |
| E-mail de lead não chega | `RESEND_API_KEY` ausente/remetente não verificado | Verifique o domínio no Resend e veja `docker compose logs app` |

Diagnóstico rápido:

```bash
docker compose ps                                   # container saudável?
curl -i http://127.0.0.1:3102/api/saude             # app responde localmente?
sudo nginx -t && sudo systemctl status nginx        # nginx ok?
sudo tail -f /var/log/nginx/maraimoveis.error.log   # erro do proxy
docker compose logs --tail=100 app                  # erro da aplicação
```

---

## Resumo — instalação em 10 comandos

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo apt install -y nginx certbot python3-certbot-nginx git
git clone <URL-DO-REPOSITORIO> /opt/apps/mara-imoveis && cd /opt/apps/mara-imoveis
cp .env.example .env && openssl rand -base64 32 && nano .env   # preencha tudo
docker compose up -d --build
curl -i http://127.0.0.1:3102/api/saude
sudo nano /etc/nginx/sites-available/maraimoveis               # cole o bloco do passo 6
sudo ln -s /etc/nginx/sites-available/maraimoveis /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d maraimoveis.felipesyste.com.br
```
