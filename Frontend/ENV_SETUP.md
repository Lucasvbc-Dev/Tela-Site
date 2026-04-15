# 🔐 Configuração de Variáveis de Ambiente

## Local (Desenvolvimento)

1. **Copie o arquivo de exemplo:**
```bash
cp .env.example .env.local
```

2. **Preencha com seus valores:**
```env
# Supabase (obtenha em https://app.supabase.com)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Backend
VITE_API_URL=http://localhost:8080

# Mercado Pago (obtenha em https://www.mercadopago.com.br/developers/panel)
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-sua-chave-publica
```

3. **⚠️ NÃO COMMITE o arquivo `.env.local`**
   - Ele está no `.gitignore` e será ignorado automaticamente
   - Cada desenvolvedor deve ter seu próprio `.env.local`

---

## Produção (Vercel)

### Opção 1: Via Dashboard Vercel (Recomendado)
1. Acesse o projeto no Vercel: https://vercel.com/dashboard
2. Vá em **Settings → Environment Variables**
3. Adicione as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (URL do seu backend em produção)
   - `VITE_MERCADOPAGO_PUBLIC_KEY`
4. Faça deploy novamente

### Opção 2: Via CLI (Vercel CLI)
```bash
# Instale Vercel CLI se não tiver
npm i -g vercel

# Configure as variáveis
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_API_URL
vercel env add VITE_MERCADOPAGO_PUBLIC_KEY

# Deploy
vercel --prod
```

---

## ✅ Checklist

- [x] `.env.local` criado (NÃO suba pro git!)
- [x] `.env.example` atualizado com comentários helpful
- [x] `.gitignore` já contém `*.local`
- [x] `supabase.ts` removeu hardcoded values
- [x] Variáveis agora são obrigatórias (erro se não definidas)

---

## 🔗 Links Úteis

- [Supabase API Keys](https://app.supabase.com/project/_/settings/api)
- [Mercado Pago Credentials](https://www.mercadopago.com.br/developers/panel)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
