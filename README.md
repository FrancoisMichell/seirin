# Seirin - Student Management API

API para gerenciamento de alunos de escola de artes marciais (Karatê), construída com NestJS, TypeORM e PostgreSQL.

## 🚀 Funcionalidades

- ✅ CRUD completo de estudantes
- ✅ Validação de dados com class-validator
- ✅ Documentação interativa com Swagger/OpenAPI
- ✅ Migrations automáticas do banco de dados
- ✅ Testes unitários e E2E com 100% de cobertura
- ✅ Docker e Docker Compose para desenvolvimento e produção
- ✅ CI/CD com GitHub Actions
- ✅ Health check endpoint

## 📋 Pré-requisitos

- Node.js 20.x ou 22.x
- Docker & Docker Compose
- PostgreSQL 15+ (ou usar via Docker)

## 🔧 Instalação

```bash
# Clonar o repositório
git clone https://github.com/FrancoisMichell/seirin.git
cd seirin

# Instalar dependências
npm install

# Criar arquivo .env com as configurações do banco
```

## 🐳 Desenvolvimento com Docker

### Modo de desenvolvimento (com hot-reload)

```bash
# Iniciar todos os serviços (app + postgres + adminer)
docker compose -f compose.debug.yaml up -d

# Ver logs
docker compose -f compose.debug.yaml logs -f seirin

# Parar serviços
docker compose -f compose.debug.yaml down
```

**Acessar:**
- API: http://localhost:3000
- **Swagger/API Docs: http://localhost:3000/api** 📚
- Adminer (DB Manager): http://localhost:8080
- Health Check: http://localhost:3000/health

### Modo de produção

```bash
# Build e iniciar (com migrations automáticas)
docker compose up -d --build

# Ver logs
docker compose logs -f seirin
```

## 💻 Desenvolvimento Local (sem Docker)

```bash
# Iniciar apenas o PostgreSQL via Docker
docker compose -f compose.debug.yaml up -d postgres

# Instalar dependências
npm install

# Executar migrations
DB_HOST=127.0.0.1 npm run migration:run

# Iniciar em modo de desenvolvimento
npm run start:dev
```

## 📖 Documentação da API (Swagger)

A documentação interativa está disponível em:

**http://localhost:3000/api**

### Endpoints principais:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/students` | Criar novo aluno |
| GET | `/students` | Listar todos os alunos |
| GET | `/students/:id` | Buscar aluno por ID |
| PATCH | `/students/:id` | Atualizar aluno |
| GET | `/health` | Health check |

### Exemplo de requisição (POST /students):

```json
{
  "name": "João Silva",
  "belt": "White",
  "birthday": "2000-01-15",
  "trainingSince": "2020-06-01"
}
```

### Níveis de faixa (Belt):
- `White` - Branca
- `Yellow` - Amarela
- `Orange` - Laranja
- `Green` - Verde
- `Blue` - Azul
- `Brown` - Marrom
- `Black` - Preta

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes E2E
npm run test:e2e

# Cobertura de testes
npm run test:cov

# Testes com Docker
docker compose -f compose.debug.yaml exec seirin npm test
```

## 🗄️ Banco de Dados

### Migrations

```bash
# Criar nova migration
npm run migration:generate -- db/migrations/NomeDaMigration

# Executar migrations (local)
DB_HOST=127.0.0.1 npm run migration:run

# Reverter última migration
DB_HOST=127.0.0.1 npm run migration:revert
```

### Estrutura da tabela `student`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| name | VARCHAR | Nome completo |
| belt | ENUM | Nível da faixa |
| birthday | DATE | Data de nascimento (opcional) |
| training_since | DATE | Início do treinamento (opcional) |
| is_active | BOOLEAN | Status ativo/inativo |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` com as seguintes variáveis:

```env
# Database
DB_TYPE=postgres
DB_HOST=postgres          # Use 'postgres' para Docker, '127.0.0.1' para local
DB_PORT=5432
DB_USER=seirin
DB_PASSWORD=seirin_password
DB_NAME=seirin_db

# Application
NODE_ENV=development
PORT=3000
RUN_MIGRATIONS=true       # true para rodar migrations no startup
```

## 🚢 Deploy

### Docker Image (GHCR)

A imagem Docker é automaticamente construída e publicada via GitHub Actions:

```bash
# Pull da imagem
docker pull ghcr.io/francoismichell/seirin:latest

# Executar
docker run -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  ghcr.io/francoismichell/seirin:latest
```

### CI/CD

- **CI Workflow**: Executado em push/PR → lint, build, testes (Node 20.x e 22.x)
- **Docker Workflow**: Build e push para GHCR em push para `main` e tags `v*`

## 🛠️ Stack Tecnológica

- **Framework**: NestJS 11
- **Database**: PostgreSQL 15
- **ORM**: TypeORM 0.3
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet
- **Testing**: Jest
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## 📦 Scripts Disponíveis

```bash
npm run start           # Iniciar aplicação
npm run start:dev       # Desenvolvimento com watch mode
npm run start:debug     # Debug mode
npm run build           # Build para produção
npm run lint            # Executar linter
npm run test            # Testes unitários
npm run test:e2e        # Testes E2E
npm run test:cov        # Cobertura de testes
npm run migration:run   # Executar migrations
npm run migration:revert # Reverter migration
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença UNLICENSED.

## 👤 Autor

**Francois Michell**

- GitHub: [@FrancoisMichell](https://github.com/FrancoisMichell)
