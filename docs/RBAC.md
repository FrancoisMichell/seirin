# Sistema de Controle de Acesso Baseado em Roles (RBAC)

## Visão Geral

O sistema implementa autorização baseada em roles (RBAC - Role-Based Access Control) usando Guards e Decorators customizados do NestJS.

## Componentes

### 1. UserRoleType (Enum)

Define os tipos de roles disponíveis:

- `STUDENT` - Aluno
- `TEACHER` - Professor

**Localização:** `src/common/enums.ts`

### 2. RolesGuard

Guard que verifica se o usuário autenticado possui as roles necessárias para acessar um endpoint.

**Localização:** `src/auth/guards/roles.guard.ts`

**Funcionamento:**

- Extrai as roles requeridas do metadata do endpoint
- Verifica se o usuário autenticado possui ao menos uma das roles requeridas
- Permite acesso se não houver roles requeridas (endpoint público após autenticação)

### 3. @Roles Decorator

Decorator usado para marcar endpoints ou controllers com as roles permitidas.

**Localização:** `src/common/decorators.ts`

**Uso:**

```typescript
import { Roles } from 'src/common/decorators';
import { UserRoleType } from 'src/common/enums';

// Aplicar em todo o controller
@Controller('classes')
@Roles(UserRoleType.TEACHER)
export class ClassesController {
  // Todos os endpoints requerem role TEACHER
}

// Ou aplicar em endpoints específicos
@Controller('users')
export class UsersController {
  @Get('profile')
  @Roles(UserRoleType.TEACHER, UserRoleType.STUDENT)
  getProfile() {
    // Pode ser acessado por TEACHER ou STUDENT
  }

  @Get('all')
  @Roles(UserRoleType.TEACHER)
  getAllUsers() {
    // Apenas TEACHER pode acessar
  }
}
```

### 4. JWT Strategy

A estratégia JWT foi atualizada para incluir as roles do usuário no payload do token.

**Localização:** `src/auth/strategies/jwt.strategy.ts`

**Payload do JWT:**

```typescript
{
  sub: string;        // ID do usuário
  username: string;   // Registry do usuário
  roles: UserRoleType[]; // Array de roles
}
```

### 5. Configuração Global

Os guards foram configurados globalmente no `AppModule`:

**Localização:** `src/app.module.ts`

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard, // Primeiro: verifica autenticação
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard, // Depois: verifica autorização
  },
];
```

## Endpoints Protegidos

Todos os seguintes controllers estão protegidos e requerem role `TEACHER`:

### 1. Classes (`/classes`)

- `POST /classes` - Criar turma
- `GET /classes` - Listar turmas
- `GET /classes/:id` - Buscar turma
- `PATCH /classes/:id` - Atualizar turma
- `DELETE /classes/:id` - Deletar turma
- `POST /classes/:id/activate` - Ativar turma
- `POST /classes/:id/deactivate` - Desativar turma
- `POST /classes/:id/enroll` - Matricular aluno
- `DELETE /classes/:id/students/:studentId` - Desmatricular aluno

### 2. Class Sessions (`/class-sessions`)

- `POST /class-sessions` - Criar sessão
- `GET /class-sessions` - Listar sessões
- `GET /class-sessions/:id` - Buscar sessão
- `PATCH /class-sessions/:id` - Atualizar sessão
- `DELETE /class-sessions/:id` - Deletar sessão
- `POST /class-sessions/:id/start` - Iniciar sessão
- `POST /class-sessions/:id/end` - Encerrar sessão
- `POST /class-sessions/:id/activate` - Ativar sessão
- `POST /class-sessions/:id/deactivate` - Desativar sessão
- `GET /class-sessions/by-class/:classId` - Buscar por turma
- `GET /class-sessions/by-teacher/:teacherId` - Buscar por professor
- `GET /class-sessions/by-date-range` - Buscar por período

### 3. Attendances (`/attendances`)

- `POST /attendances` - Criar presença
- `POST /attendances/bulk/:sessionId` - Criar presenças em lote
- `GET /attendances` - Listar presenças
- `GET /attendances/:id` - Buscar presença
- `PATCH /attendances/:id` - Atualizar presença
- `DELETE /attendances/:id` - Deletar presença
- `GET /attendances/session/:sessionId` - Buscar por sessão
- `GET /attendances/student/:studentId` - Buscar por aluno
- `POST /attendances/:id/present` - Marcar como presente
- `POST /attendances/:id/late` - Marcar como atrasado
- `POST /attendances/:id/absent` - Marcar como faltou
- `POST /attendances/:id/excused` - Marcar como justificado

### 4. Students (`/students`)

- `POST /students` - Criar aluno
- `GET /students` - Listar alunos
- `GET /students/:id` - Buscar aluno
- `PATCH /students/:id` - Atualizar aluno

### 5. Teachers (`/teacher`)

- `POST /teacher/login` - Login (público - `@Public()`)
- `GET /teacher/profile` - Buscar perfil

## Endpoints Públicos

Para tornar um endpoint público (não requer autenticação), use o decorator `@Public()`:

```typescript
import { Public } from 'src/common/decorators';

@Controller('teacher')
export class TeachersController {
  @Public()
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }
}
```

## Fluxo de Autenticação e Autorização

1. **Requisição chega ao servidor**
2. **JwtAuthGuard** verifica se há token JWT válido
   - Se não houver e o endpoint não for `@Public()`, retorna 401 Unauthorized
   - Se houver, decodifica o token e adiciona `user` ao request
3. **RolesGuard** verifica as roles
   - Se não houver `@Roles()` no endpoint, permite acesso
   - Se houver, verifica se o usuário tem ao menos uma das roles requeridas
   - Se não tiver, retorna 403 Forbidden
4. **Controller** processa a requisição

## Exemplo de Uso na Prática

### 1. Login e obtenção do token

```bash
POST /teacher/login
Content-Type: application/json

{
  "registry": "T001",
  "password": "senha123"
}

# Resposta
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "registry": "T001",
    "roles": [
      { "role": "teacher" }
    ]
  }
}
```

### 2. Usar o token para acessar endpoints protegidos

```bash
POST /classes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Jiu-Jitsu Iniciante",
  "description": "Turma para iniciantes",
  "teacherId": "uuid",
  "daysOfWeek": [1, 3, 5],
  "startTime": "18:00",
  "endTime": "19:30"
}
```

### 3. Tentativa de acesso sem token ou com role incorreta

```bash
# Sem token
POST /classes
# Retorna: 401 Unauthorized

# Com token mas role STUDENT
POST /classes
Authorization: Bearer [token com role STUDENT]
# Retorna: 403 Forbidden
```

## Futuras Expansões

Caso precise adicionar mais roles ou funcionalidades:

### 1. Adicionar nova role

```typescript
// src/common/enums.ts
export enum UserRoleType {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin', // Nova role
}
```

### 2. Criar endpoints com múltiplas roles permitidas

```typescript
@Get('statistics')
@Roles(UserRoleType.TEACHER, UserRoleType.ADMIN)
getStatistics() {
  // Pode ser acessado por TEACHER ou ADMIN
}
```

### 3. Criar decorator para verificar permissões específicas

```typescript
// src/common/decorators.ts
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Uso
@Permissions('create:class', 'delete:class')
manageClass() {
  // Requer permissões específicas
}
```

## Testes

Testes unitários foram criados para o `RolesGuard` em:

- `src/auth/guards/roles.guard.spec.ts`

Para executar os testes:

```bash
npm test -- roles.guard.spec.ts
```
