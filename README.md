# Mara Imóveis — Sistema de Gestão de Imóveis para Aluguel

Next.js (App Router) + TypeScript + Tailwind CSS, organizado em **Clean Architecture**.
Todos os dados são mockados hoje, mas o acesso a dados passa por **interfaces de repositório**:
trocar mock por Prisma/Supabase não toca em regra de negócio nem em componente de UI.

## Rodando

```bash
npm install
cp .env.example .env.local   # opcional: sem RESEND_API_KEY os e-mails só vão para o console
npm run dev                  # http://localhost:3000
```

**Acesso ao painel** (`/login`):

| Papel | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@maraimoveis.com.br` | `admin123` |
| Gestor | `gestor@maraimoveis.com.br` | `gestor123` |

**Acesso ao portal do inquilino** (`/portal/login`): login e senha são o documento.
No primeiro acesso ele é levado à troca de senha, podendo adiar.

| Inquilino | Documento (login e senha inicial) | Cenário |
| --- | --- | --- |
| Marcos Antônio Pereira | `30987654373` | Ocupação ativa, contrato e pendências |
| Ana Beatriz Moraes | `38472619087` | Ocupação ativa, tudo em dia |
| Carlos Eduardo Lima | `21598734032` | Sem ocupação ativa, só histórico |
| Distribuidora Verde Vale | `18452396000173` | Pessoa jurídica (CNPJ) |

Os dados mockados são materializados em `.data/*.json` no primeiro acesso. Para voltar ao
estado inicial, apague a pasta: `rm -rf .data`.

## Arquitetura

Dependências apontam sempre para dentro. `domain` não conhece ninguém; `application` conhece
apenas interfaces de `domain`; `infrastructure` implementa essas interfaces; `app` fala só com
casos de uso.

```
src/
├── domain/                 Regras e contratos, sem framework
│   ├── entities/           Imovel, Inquilino, Ocupacao, Contrato, Pagamento, Usuario, Lead
│   ├── value-objects/      Dinheiro, Endereco, Periodo, data local
│   ├── repositories/       Interfaces: ImovelRepository, PagamentoRepository, ...
│   ├── services/           Portas: StorageService, EmailService, SessionService, ContratoPdfService
│   └── errors/             ErroDominio, RecursoNaoEncontrado, RegraDeNegocioViolada
│
├── application/            Casos de uso e orquestração
│   ├── use-cases/          imoveis, inquilinos, ocupacoes, contratos, financeiro, relatorios, auth, leads
│   ├── dtos/               Views que cruzam agregados (CobrancaMensal, OcupacaoDetalhada, ...)
│   ├── schemas/            Validação zod compartilhada por formulário e Server Action
│   ├── templates/          Conteúdo do e-mail de lead
│   ├── mappers.ts          Entidade → DTO
│   └── ports.ts            Tudo que a aplicação precisa do mundo externo
│
├── infrastructure/         Implementações concretas
│   ├── mocks/              Dados de seed (datas relativas a hoje)
│   ├── persistence/        JsonStore — coleção em arquivo, escrita atômica e serializada
│   ├── repositories/       MockImovelRepository, MockPagamentoRepository, ...
│   ├── pdf/                Template @react-pdf/renderer + adapter
│   ├── email/              Resend (com fallback de console)
│   ├── storage/            Upload local servido por rota
│   ├── auth/               Sessão em cookie httpOnly assinado (HMAC)
│   └── container.ts        Composition root — único lugar com classes concretas
│
├── presentation/
│   ├── components/ui/      Button, Card, Modal, Table, Field, Skeleton, EmptyState, ...
│   ├── features/           Componentes por domínio (PropertyCard, PainelCobrancas, gráficos)
│   └── layouts/            Header público, sidebar do admin
│
├── app/                    Rotas (App Router)
│   ├── (public)/           / · /imoveis/[id] · /contato
│   ├── (admin)/admin/      dashboard · imoveis · inquilinos · ocupacoes · contratos · financeiro · relatorios · leads
│   ├── (portal)/portal/    login · (autenticado)/ → painel do inquilino e troca de senha
│   ├── api/                arquivos/[...chave] · contratos/[id]/pdf
│   └── _actions/           Server Actions (validam com zod e chamam casos de uso)
│
├── casos-de-uso.ts         Fachada: o único módulo que as rotas importam
└── middleware.ts           Guarda de navegação de /admin
```

### Decisões que valem explicar

**Entidades como tipos + funções puras, não classes.** Objetos simples atravessam a fronteira
Server → Client do React sem serialização customizada. O comportamento vive em módulos com o
mesmo nome (`Pagamento.saldoDevedor(p)`, `Imovel.fotoCapa(i)`), então a regra continua junto do dado.

**Saldo devedor é derivado, nunca armazenado.** `Pagamento` guarda a lista de recebimentos;
total, pago, saldo e status são calculados. Não existe estado financeiro dessincronizado.

**Dinheiro em reais, aritmética em centavos.** O value object `Dinheiro` arredonda por centavos
em toda operação, então `0,1 + 0,2` nunca vira `0,30000000000000004`.

**Datas de dia são ancoradas ao meio-dia local.** `new Date("2026-09-05")` é meia-noite UTC e no
Brasil cai no dia anterior — o que faria cobranças parecerem vencidas cedo demais. `paraDataLocal`
elimina essa classe de erro.

**Exclusão preserva histórico.** Imóvel ou inquilino com ocupações registradas é **inativado**,
não apagado: o histórico de ocupações, contratos e financeiro continua acessível depois da saída.

**Rotas do admin sob `/admin`.** Evita colisão entre a vitrine pública (`/imoveis/[id]`) e o
CRUD interno (`/admin/imoveis/[id]`).

**Duas sessões independentes.** Painel e portal do inquilino têm cookies, payloads
e ciclos de vida separados: `CookieSessionService` é genérico e recebe o nome do cookie
no construtor. Estar logado no portal não abre nenhuma rota `/admin`, e vice-versa.

**Senha do inquilino nasce como o documento e some do disco depois.** Enquanto ele
não define uma senha, não existe credencial salva — a validação compara com o próprio
documento. Ao trocar, o que fica gravado é um hash scrypt com sal; a senha escolhida
nunca aparece em `.data/`. Trocar de volta para o documento é recusado.

**Autorização de arquivo por posse, não por obscuridade.** O PDF de um contrato só é
servido para o admin ou para o inquilino daquela ocupação. Fotos de imóvel são públicas
(já estão na vitrine); qualquer outra pasta do storage exige sessão.

**Um só ponto de composição.** `infrastructure/container.ts` monta as implementações;
`src/casos-de-uso.ts` expõe os casos de uso prontos. Migrar para banco real é editar esses arquivos.

### Trocando o mock por um banco real

1. Implemente as interfaces de `domain/repositories/` (ex: `PrismaImovelRepository`).
2. Troque a linha correspondente em `infrastructure/container.ts`.
3. Pronto — nenhum caso de uso, schema ou tela muda.

O mesmo vale para `StorageService` (S3/Supabase Storage), `EmailService` e `SessionService`.

## Funcionalidades

**Área pública** — vitrine com filtros na URL (bairro, cidade, tipo, faixa de preço), página de
detalhes com galeria e lightbox, contato via WhatsApp com mensagem pré-preenchida e formulário
que registra o lead e notifica por e-mail (Resend).

**Portal do inquilino** (`/portal`) — login com CPF/CNPJ, primeiro acesso com o documento
como senha e troca de senha própria; mostra o imóvel vinculado, o contrato com download do
PDF, as pendências em aberto com a composição de cada cobrança (aluguel, água, luz, extras)
e o histórico do que já pagou, com data e forma de pagamento. Somente leitura: quem lança
recebimento continua sendo o gestor, então o número nunca diverge. No painel, a página do
inquilino mostra se ele já criou senha própria e permite devolver o acesso à senha padrão
quando ele esquecer.

**Painel** — dashboard com indicadores e receita dos últimos 12 meses; CRUD de imóveis com upload
de múltiplas fotos reordenáveis e foto de capa; CRUD de inquilinos com histórico completo;
ocupações com entrada e saída (motivo e condições de entrega); contratos com PDF gerado a partir
de componentes React; financeiro com aluguel, água, luz, extras, saldo devedor e recebimentos
parciais; relatórios comparando períodos de ocupação do mesmo imóvel (receita, vacância,
inadimplência); leads com atalho de WhatsApp.

## Qualidade

- **Mobile first**: todas as rotas verificadas a 360 px sem overflow horizontal; listas viram
  cartões no mobile e tabelas a partir de `lg`.
- **Acessibilidade**: labels associadas, `aria-invalid` e mensagens de erro com `role="alert"`,
  foco visível global, textos alternativos obrigatórios nas fotos, modais com foco preso e Escape.
- **Gráficos**: paleta validada para daltonismo e contraste; eixo único, legenda presente e
  visão em tabela alternativa.
- **Estados**: skeletons, estados vazios e telas de erro em todas as rotas; toasts em toda ação.

## Variáveis de ambiente

Todas são lidas em **runtime** — mudou o valor, basta reiniciar o container, sem reconstruir
a imagem. O template completo está em `.env.example`.

| Variável | Para quê |
| --- | --- |
| `SESSAO_SECRET` | **Obrigatória em produção** (mín. 16 caracteres). Assina os cookies do painel e do portal. Sem ela o app se recusa a criar sessão. |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | **Obrigatórias em produção.** Criam o administrador no primeiro start. A senha é gravada como hash scrypt. |
| `ADMIN_NOME` | Nome exibido do administrador (padrão: "Administrador"). |
| `WHATSAPP` | Número da imobiliária (formato internacional, só dígitos). |
| `RESEND_API_KEY` | Envio real dos e-mails de contato. Sem ela, o lead é salvo e o e-mail é logado. |
| `EMAIL_DESTINO_CONTATO` | Caixa que recebe os leads. |
| `EMAIL_REMETENTE` | Remetente verificado no Resend. |
| `DIRETORIO_DADOS` | Onde ficam os JSON e os uploads (padrão `.data`; no container, `/app/dados`). |
| `DADOS_DEMONSTRACAO` | `true` sobe com os dados de exemplo; `false` sobe vazio. Sem valor: vazio em produção, exemplo em desenvolvimento. |
| `PORTA_HOST` | Só para o compose: porta do host onde o container escuta (padrão `3102`). |
| `ENDERECO_IMOBILIARIA` | Endereço mostrado no rodapé e na página de contato. |
| `N8N_WEBHOOK_CONTRATO_URL` | Webhook do n8n que recebe o contrato. Sem ela, o botão "Enviar WhatsApp" não aparece. |
| `N8N_WEBHOOK_TOKEN` | Opcional: vai como `Authorization: Bearer <token>` na chamada ao n8n. |

## Contrato de locação

O PDF segue o contrato em papel que a imobiliária usa: preâmbulo, qualificação
das partes e as cláusulas de **objeto, prazo, valor e pagamento e conservação**.
Caução e reajuste entram como parágrafos da cláusula de valor, e só quando
existem — contrato sem caução não ganha parágrafo de garantia.

A qualificação da **locadora** (nome, profissão, RG, endereço) é fixa em
`src/lib/config.ts`: há uma única locadora. O template não sabe disso — recebe
as duas partes por parâmetro —, então transformar isso em cadastro depois é
mexer só na configuração.

Do **locatário** saem nome, profissão, RG, CPF e telefone, tudo do cadastro do
inquilino. Campo não preenchido não vira linha em branco: ele some do PDF.

## Envio do contrato pelo n8n

Na tela de contratos, **Enviar WhatsApp** entrega o PDF a um fluxo do n8n, que
decide o destino — o número fica no próprio fluxo, não no sistema. Se o contrato
ainda não tiver PDF, ele é gerado antes: o arquivo enviado é sempre o mesmo que
fica no painel.

Configure `N8N_WEBHOOK_CONTRATO_URL` (e, se quiser autenticação, `N8N_WEBHOOK_TOKEN`).
O `POST` chega assim:

```json
{
  "evento": "contrato.gerado",
  "contrato": { "id": "ctr_...", "numero": "0001/2026", "status": "vigente",
                "dataInicio": "2026-08-10", "dataFim": "2027-02-10", "valorAluguel": 500 },
  "locatario": { "nome": "...", "documento": "121.187.438-90", "rg": "26.383.656-3",
                 "telefone": "5518997943842", "email": "..." },
  "imovel": { "titulo": "...", "endereco": "..." },
  "pdf": { "nomeArquivo": "contrato-0001-2026.pdf", "tipo": "application/pdf",
           "base64": "JVBERi0xLjcK..." }
}
```

No fluxo, um nó **Convert to File → Base64 to File** sobre `pdf.base64` produz o
binário pronto para o nó de WhatsApp. Um status HTTP fora da faixa 2xx volta como
erro na tela, com o corpo da resposta do n8n na mensagem.

## Deploy na VPS

Sobe **vazio**: sem imóveis, inquilinos, contratos ou pagamentos, apenas com o administrador
que você definir. Os dados de demonstração ficam restritos ao desenvolvimento.

```bash
git clone <seu-repositorio> mara-imoveis && cd mara-imoveis

cp .env.example .env
openssl rand -base64 32          # cole em SESSAO_SECRET
nano .env                        # preencha ADMIN_EMAIL, ADMIN_SENHA, WHATSAPP...

docker compose up -d --build
docker compose ps                # deve ficar "healthy" em ~20s
```

O container publica **apenas em `127.0.0.1:3102`** — quem expõe na internet é o seu proxy
reverso. Troque `PORTA_HOST` no `.env` se a 3102 já estiver ocupada.

### nginx

```nginx
server {
    server_name imoveis.seudominio.com.br;

    client_max_body_size 12M;          # upload de fotos (limite do app: 5 MB por foto)

    location / {
        proxy_pass         http://127.0.0.1:3102;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   X-Forwarded-Host  $host;
    }
}
```

`X-Forwarded-Proto` e `X-Forwarded-Host` não são opcionais: é com eles que o link do imóvel
no e-mail de lead sai com o domínio e o protocolo certos.

### Operação

```bash
docker compose logs -f app                 # acompanhar
docker compose up -d --build               # atualizar após um git pull
docker compose restart app                 # aplicar mudança de .env

# backup dos dados e dos arquivos enviados
docker run --rm -v mara-imoveis_mara-dados:/dados -v "$PWD":/backup alpine \
  tar czf /backup/mara-backup-$(date +%F).tar.gz -C /dados .

# restaurar
docker run --rm -v mara-imoveis_mara-dados:/dados -v "$PWD":/backup alpine \
  sh -c "rm -rf /dados/* && tar xzf /backup/mara-backup-AAAA-MM-DD.tar.gz -C /dados"
```

Tudo que você cadastrar vive no volume `mara-dados` (`/app/dados` no container): os JSON, as
fotos dos imóveis e os PDFs dos contratos. `docker compose down` preserva o volume;
**`docker compose down -v` apaga tudo.**

> `ADMIN_EMAIL` e `ADMIN_SENHA` valem apenas no **primeiro start**, quando o usuário é criado.
> Mudar essas variáveis depois não altera o usuário já gravado — para trocar a senha, apague
> `usuarios.json` do volume e reinicie, ou edite o registro direto no arquivo.

> **Limites conhecidos da autenticação.** As senhas do painel e do portal são guardadas como
> hash scrypt com sal, e o segredo de sessão é obrigatório em produção. Ainda não há, porém,
> limite de tentativas de login, autenticação em dois fatores nem recuperação por e-mail — a
> recuperação do inquilino é o gestor redefinir o acesso pelo painel. A sessão é um cookie
> assinado, sem refresh nem revogação: para revogar, troque `SESSAO_SECRET` (isso desloga todo
> mundo). Substituir o adapter de `SessionService` por NextAuth/Clerk resolve os três pontos.
