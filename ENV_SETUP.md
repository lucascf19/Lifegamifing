# Configuração do Ambiente (.env)

## 📋 Passo a Passo

### 1. Criar arquivo .env

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 2. Obter credenciais do Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Vá em **Settings** > **API**
3. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`

### 3. Configurar no código

#### Opção A: Desenvolvimento Simples (sem bundler)

Edite o arquivo `config.js` e preencha manualmente:

```javascript
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-aqui';
```

#### Opção B: Com Bundler (Vite, Webpack, etc)

Se estiver usando um bundler que processa `.env`:

1. Renomeie as variáveis no `.env`:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

2. No `config.js`, descomente:
   ```javascript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
   ```

#### Opção C: Produção (variáveis injetadas pelo servidor)

Configure seu servidor para injetar as variáveis:

```javascript
// No servidor (Node.js, PHP, etc)
window.SUPABASE_URL = process.env.SUPABASE_URL;
window.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
```

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` no Git
- ✅ O arquivo `.gitignore` já está configurado para ignorar `.env`
- ✅ Use `.env.example` como template (sem valores reais)

## ✅ Verificação

Arifique:

- ✅ Mensagem: "Supabase conectado com sucesso!"
- ✅ Região: "sa-east-1 (São Paulo)"
- ✅ URL do projeto exibida

Se aparecer avisos, verifique se as credenciais estão corretas no `config.js`.
