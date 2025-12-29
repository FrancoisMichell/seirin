# Testes E2E

Este diretório contém os testes end-to-end (e2e) da aplicação Seirin.

## Banco de Dados de Testes

Os testes e2e utilizam um banco de dados PostgreSQL separado do banco de desenvolvimento para evitar conflitos e garantir a integridade dos dados.

### Configuração

O banco de dados de testes está configurado em:

- **Serviço Docker**: `postgres-test` (definido em `compose.yaml`)
- **Porta**: 5433 (mapeada da porta 5432 do container)
- **Credenciais**: Definidas em `.env.test`

### Comandos Disponíveis

```bash
# Iniciar o banco de dados de testes
npm run test:e2e:setup

# Executar as migrações no banco de testes
npm run test:e2e:migrate

# Executar todos os testes e2e
npm run test:e2e

# Executar um arquivo específico de teste
npm run test:e2e -- auth.e2e-spec.ts

# Parar o banco de dados de testes
npm run test:e2e:teardown
```

### Fluxo de Trabalho Recomendado

1. Iniciar o banco de dados de testes:

   ```bash
   npm run test:e2e:setup
   ```

2. Executar as migrações:

   ```bash
   npm run test:e2e:migrate
   ```

3. Executar os testes:

   ```bash
   npm run test:e2e
   ```

4. Após os testes, você pode parar o banco (opcional):
   ```bash
   npm run test:e2e:teardown
   ```

## Helpers de Teste

### setup-e2e.ts

O arquivo `setup-e2e.ts` é carregado automaticamente pelo Jest antes de todos os testes e2e (configurado em `jest-e2e.json`). Ele fornece:

1. **Carregamento automático do `.env.test`** - Variáveis de ambiente de teste
2. **Funções utilitárias** - Para configurar e limpar a aplicação de teste

#### Funções Disponíveis

**`createTestApp()`**

- Cria e inicializa uma aplicação NestJS para testes
- Aplica automaticamente todas as configurações comuns (pipes, interceptors)
- Retorna um objeto com `app`, `module` e `dataSource`

**`setupTestDatabase(dataSource, waitTime?)`**

- Inicializa o banco de dados de teste
- Aguarda a conexão (padrão: 2000ms)
- Dropa o banco e executa as migrations

**`teardownTestApp(app, dataSource)`**

- Limpa a aplicação e conexões do banco
- Deve ser chamado no `afterAll` dos testes

#### Exemplo de Uso

```typescript
import { createTestApp, setupTestDatabase, teardownTestApp } from './setup-e2e';

describe('My E2E Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Cria a aplicação e obtém as dependências
    const testContext = await createTestApp();
    app = testContext.app;
    dataSource = testContext.dataSource;

    // Obtém serviços necessários
    const myService = testContext.module.get<MyService>(MyService);

    // Configura o banco
    await setupTestDatabase(dataSource);

    // Cria dados de teste...
  });

  afterAll(async () => {
    await teardownTestApp(app, dataSource);
  });

  // Seus testes aqui...
});
```

#### Benefícios

- **DRY**: Elimina duplicação de código entre os testes
- **Consistência**: Todos os testes usam a mesma configuração
- **Manutenibilidade**: Mudanças na configuração em um único lugar
- **Simplicidade**: Menos boilerplate nos arquivos de teste

### Notas Importantes

- O banco de testes roda em uma porta diferente (5433) para não conflitar com o banco de desenvolvimento
- Os dados são persistidos em um volume Docker separado (`pgdata-test`)
- O arquivo `.env.test` é carregado automaticamente pelo setup dos testes
- Cada execução de teste limpa e recria as tabelas para garantir isolamento
