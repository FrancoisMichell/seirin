# Seirin - Student Management API

[![CI](https://github.com/FrancoisMichell/seirin/actions/workflows/ci.yml/badge.svg)](https://github.com/FrancoisMichell/seirin/actions/workflows/ci.yml)
[![Docker](https://github.com/FrancoisMichell/seirin/actions/workflows/docker.yml/badge.svg)](https://github.com/FrancoisMichell/seirin/actions/workflows/docker.yml)
[![GHCR](https://img.shields.io/badge/GHCR-seirin-blue?logo=github)](https://ghcr.io/francoismichell/seirin)
[![Node](https://img.shields.io/badge/node-20.x%20%7C%2022.x-339933?logo=node.js&logoColor=white)](#)

API para gerenciamento de alunos de escola de artes marciais (Karatê), construída com NestJS, TypeORM e PostgreSQL.

## 🚀 Funcionalidades

- ✅ CRUD completo de estudantes
- ✅ CRUD completo de professores (teachers)
- ✅ Gestão de turmas (classes) com matrícula de alunos
- ✅ Gestão de sessões de aulas (class sessions) com registro de presença
- ✅ Autenticação JWT para professores
- ✅ Validação de dados com class-validator
- ✅ Documentação interativa com Swagger/OpenAPI
- ✅ Migrations automáticas do banco de dados
- ✅ Testes unitários e E2E com 100% de cobertura
- ✅ Docker e Docker Compose para desenvolvimento e produção
- ✅ CI/CD com GitHub Actions
- ✅ Coleção completa de requisições no Bruno
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

### Docker Compose e .env

Os arquivos [compose.yaml](compose.yaml) e [compose.debug.yaml](compose.debug.yaml) carregam variáveis do [.env](.env) para a aplicação e o Postgres:

- App: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `RUN_MIGRATIONS`.
- Postgres: `POSTGRES_DB` ← `DB_NAME`, `POSTGRES_USER` ← `DB_USER`, `POSTGRES_PASSWORD` ← `DB_PASSWORD`.

Isso mantém as credenciais centralizadas no `.env` e evita duplicação.

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

#### Students (Alunos)

| Método | Endpoint        | Descrição              |
| ------ | --------------- | ---------------------- |
| POST   | `/students`     | Criar novo aluno       |
| GET    | `/students`     | Listar todos os alunos |
| GET    | `/students/:id` | Buscar aluno por ID    |
| PATCH  | `/students/:id` | Atualizar aluno        |
| DELETE | `/students/:id` | Deletar aluno          |

#### Teachers (Professores)

| Método | Endpoint        | Descrição                |
| ------ | --------------- | ------------------------ |
| POST   | `/teachers`     | Criar novo professor     |
| GET    | `/teachers`     | Listar todos professores |
| GET    | `/teachers/:id` | Buscar professor por ID  |
| PATCH  | `/teachers/:id` | Atualizar professor      |
| DELETE | `/teachers/:id` | Deletar professor        |
| GET    | `/teachers/me`  | Perfil do professor      |

#### Classes (Turmas)

| Método | Endpoint                           | Descrição              |
| ------ | ---------------------------------- | ---------------------- |
| POST   | `/classes`                         | Criar nova turma       |
| GET    | `/classes`                         | Listar todas as turmas |
| GET    | `/classes/:id`                     | Buscar turma por ID    |
| PATCH  | `/classes/:id`                     | Atualizar turma        |
| PATCH  | `/classes/:id/activate`            | Ativar turma           |
| PATCH  | `/classes/:id/deactivate`          | Desativar turma        |
| POST   | `/classes/:id/enroll/:studentId`   | Matricular aluno       |
| DELETE | `/classes/:id/unenroll/:studentId` | Desmatricular aluno    |

#### Class Sessions (Sessões de Aula)

| Método | Endpoint                            | Descrição               |
| ------ | ----------------------------------- | ----------------------- |
| POST   | `/class-sessions`                   | Criar nova sessão       |
| GET    | `/class-sessions`                   | Listar todas as sessões |
| GET    | `/class-sessions/:id`               | Buscar sessão por ID    |
| GET    | `/class-sessions/by-class/:classId` | Sessões por turma       |
| GET    | `/class-sessions/by-teacher/:id`    | Sessões por professor   |
| GET    | `/class-sessions/by-date-range`     | Sessões por período     |
| PATCH  | `/class-sessions/:id`               | Atualizar sessão        |
| PATCH  | `/class-sessions/:id/start`         | Iniciar sessão          |
| PATCH  | `/class-sessions/:id/end`           | Finalizar sessão        |
| PATCH  | `/class-sessions/:id/activate`      | Ativar sessão           |
| PATCH  | `/class-sessions/:id/deactivate`    | Desativar sessão        |
| DELETE | `/class-sessions/:id`               | Deletar sessão          |

#### Authentication (Autenticação)

| Método | Endpoint         | Descrição       |
| ------ | ---------------- | --------------- |
| POST   | `/teacher/login` | Login professor |

#### Health

| Método | Endpoint  | Descrição    |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

### Exemplos de requisições:

#### POST /students

```json
{
  "name": "João Silva",
  "belt": "White",
  "birthday": "2000-01-15",
  "trainingSince": "2020-06-01"
}
```

#### POST /classes

```json
{
  "name": "Iniciantes - Segunda 18h",
  "days": [1, 3],
  "startTime": "18:00",
  "durationMinutes": 60,
  "teacherId": "teacher-uuid"
}
```

#### POST /class-sessions

```json
{
  "classId": "class-uuid",
  "date": "2025-12-30",
  "actualStartTime": "18:00",
  "notes": "Introdução ao Jiu-Jitsu"
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

### Estrutura das principais tabelas:

#### Tabela `student`:

| Campo          | Tipo      | Descrição                        |
| -------------- | --------- | -------------------------------- |
| id             | UUID      | Identificador único              |
| name           | VARCHAR   | Nome completo                    |
| belt           | ENUM      | Nível da faixa                   |
| birthday       | DATE      | Data de nascimento (opcional)    |
| training_since | DATE      | Início do treinamento (opcional) |
| is_active      | BOOLEAN   | Status ativo/inativo             |
| created_at     | TIMESTAMP | Data de criação                  |
| updated_at     | TIMESTAMP | Data de atualização              |

#### Tabela `user` (Teachers):

| Campo      | Tipo      | Descrição               |
| ---------- | --------- | ----------------------- |
| id         | UUID      | Identificador único     |
| name       | VARCHAR   | Nome completo           |
| username   | VARCHAR   | Login (único)           |
| password   | VARCHAR   | Senha (hash bcrypt)     |
| email      | VARCHAR   | Email (único, opcional) |
| is_active  | BOOLEAN   | Status ativo/inativo    |
| created_at | TIMESTAMP | Data de criação         |
| updated_at | TIMESTAMP | Data de atualização     |

#### Tabela `class`:

| Campo            | Tipo      | Descrição                      |
| ---------------- | --------- | ------------------------------ |
| id               | UUID      | Identificador único            |
| name             | VARCHAR   | Nome da turma                  |
| days             | INT[]     | Dias da semana (0=Dom...6=Sab) |
| start_time       | TIME      | Horário de início              |
| duration_minutes | INT       | Duração em minutos             |
| teacher_id       | UUID      | ID do professor (FK)           |
| is_active        | BOOLEAN   | Status ativo/inativo           |
| created_at       | TIMESTAMP | Data de criação                |
| updated_at       | TIMESTAMP | Data de atualização            |

#### Tabela `class_session`:

| Campo             | Tipo      | Descrição               |
| ----------------- | --------- | ----------------------- |
| id                | UUID      | Identificador único     |
| class_id          | UUID      | ID da turma (FK)        |
| date              | DATE      | Data da sessão          |
| actual_start_time | TIME      | Horário real de início  |
| actual_end_time   | TIME      | Horário real de término |
| notes             | TEXT      | Observações             |
| is_active         | BOOLEAN   | Status ativo/inativo    |
| created_at        | TIMESTAMP | Data de criação         |
| updated_at        | TIMESTAMP | Data de atualização     |

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

### Exemplo pronto

Você pode começar copiando o modelo:

```bash
cp .env.example .env
```

Depois ajuste os valores conforme seu ambiente (Docker vs local).

#### Opção: `DB_LOGGING`

Habilite logs de queries do TypeORM em desenvolvimento:

```env
DB_LOGGING=true  # útil para debugar consultas SQL
```

## � Commits

Este projeto utiliza **Conventional Commits** com validação automática via [Commitlint](https://commitlint.js.org/).

### Formato

```
type(scope): subject
```

**Types:**

- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Documentação
- `style` - Formatação de código
- `refactor` - Refatoração sem mudança de comportamento
- `perf` - Melhoria de performance
- `test` - Testes
- `chore` - Tarefas administrativas
- `ci` - Alterações em CI/CD
- `revert` - Reverter commit anterior

**Exemplos:**

```bash
git commit -m "feat: add student authentication"
git commit -m "fix(students): resolve pagination bug"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

## �🚢 Deploy

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
