# 🚀 GUIA RÁPIDO - Como Iniciar o Sistema de Email

## ⚡ TL;DR (Versão Rápida)

```bash
# 1. Inicie o backend
cd TelaOficial/backend/backendtela
./mvnw.cmd spring-boot:run

# 2. Inicie o frontend
cd TelaOficial/Frontend
npm run dev

# 3. Teste a página de contato
http://localhost:5173/contato
```

---

## 📋 Checklist Rápido

### ✅ Antes de Começar
- [ ] Você tem Java 21 instalado?
- [ ] Você tem Node.js instalado?
- [ ] A senha SMTP foi recebida? (rzfyqydzadtwktvh)

### ✅ Configuração
- [x] application.properties - JÁ CONFIGURADO
- [x] SMTP com Gmail - JÁ CONFIGURADO
- [x] Frontend - JÁ PREPARADO
- [x] Endpoints - JÁ IMPLEMENTADOS

---

## 🎯 Teste 1: Email de Contato (Mais Rápido)

### Passo 1: Abrir Página de Contato
```
1. Abra: http://localhost:5173/contato
2. Você verá o formulário
```

### Passo 2: Preencher Formulário
```
Nome:    João Silva
Email:   seu-email@gmail.com
Assunto: Teste
Mensagem: Este é um teste do sistema (mínimo 10 caracteres)
```

### Passo 3: Clicar Enviar
```
Clique em "Enviar Mensagem"
Veja a mensagem "Mensagem enviada!" 🎉
```

### Passo 4: Verificar Email
```
Abra: https://mail.google.com
Procure por: tela.contato123@gmail.com
Você receberá um email com os dados do contato ✅
```

**Tempo total:** ~1 minuto ⏱️

---

## 🎯 Teste 2: Email de Confirmação (Mais Completo)

### Passo 1: Fazer Login
```
1. Acesse: http://localhost:5173
2. Clique em "Minha Conta" ou "Login"
3. Faça login (crie conta se necessário)
```

### Passo 2: Adicionar ao Carrinho
```
1. Navegue até produtos
2. Selecione um produto
3. Clique em "Adicionar ao Carrinho"
```

### Passo 3: Ir para Checkout
```
1. Abra o carrinho
2. Clique em "Finalizar Compra"
```

### Passo 4: Preencher Checkout
```
Endereço: Rua das Flores, 123
CEP:      60000-000
Cidade:   Fortaleza
Estado:   CE
```

### Passo 5: Pagar
```
Escolha um método de pagamento:
- PIX (teste rápido)
- Cartão (teste completo)

Siga as instruções na tela
```

### Passo 6: Verificar Email
```
Após confirmar o pagamento:
1. Abra seu email
2. Procure por email de confirmação
3. Verifique todos os detalhes ✅
   - Número do pedido
   - Itens comprados
   - Total
   - Endereço de entrega
```

**Tempo total:** ~3-5 minutos ⏱️

---

## 🐛 Troubleshooting Rápido

### Problema: "Enviando..." fica preso

**Solução:**
1. Verifique se backend está rodando
2. Abra console (F12) e procure por erro
3. Verifique logs do backend

### Problema: Email não chega

**Solução:**
1. Procure em Spam/Lixo
2. Verifique os logs do backend
3. Teste conectividade: `telnet smtp.gmail.com 587`

### Problema: Erro no formulário

**Solução:**
1. Preencha corretamente:
   - Nome: mínimo 3 caracteres
   - Email: formato válido (xxx@yyy.zzz)
   - Mensagem: mínimo 10 caracteres
2. Veja as mensagens de erro em vermelho

---

## 📊 Status da Implementação

| Componente | Status |
|-----------|--------|
| Backend SMTP | ✅ Funcionando |
| Endpoints | ✅ Testados |
| Frontend | ✅ Pronto |
| Validação | ✅ Completa |
| Segurança | ✅ Implementada |
| **GERAL** | **✅ PRONTO** |

---

## 📚 Documentação Completa

Se quiser detalhes técnicos, veja:

1. **README_EMAIL.md** - Resumo profissional
2. **EMAIL_SETUP.md** - Guia técnico completo
3. **EMAIL_TESTS_EXAMPLES.md** - Exemplos código
4. **CHECKLIST.md** - Lista detalhada

---

## 🎯 Próximas Etapas

### Depois que testar
1. ✅ Valide os emails recebidos
2. ✅ Verifique formatação
3. ✅ Teste em 2+ clientes (Gmail, Outlook)
4. ✅ Pronto para produção!

### Opcional
- [ ] Adicionar rate limiting
- [ ] Melhorar templates
- [ ] Implementar fila de emails
- [ ] Dashboard de relatórios

---

## 💬 Perguntas Frequentes

### P: Qual a senha SMTP?
**R:** `rzfyqydzadtwktvh` (já configurada)

### P: Preciso fazer algo especial no Gmail?
**R:** Não! Já foi configurado. Só receba os emails.

### P: E se der erro?
**R:** Veja os logs: `./logs/backendtela.log`

### P: Quanto tempo demora?
**R:** Contato: ~1min | Pedido: ~3-5min

### P: Funciona em produção?
**R:** Sim! Basta configurar variáveis de ambiente.

---

## 🎉 Sucesso!

Quando você receber o primeiro email, parabéns! 🎊

Seu sistema de emails está funcionando perfeitamente!

---

**Dúvidas?** Consulte os arquivos .md na raiz do projeto.

**Última atualização:** 16 de abril de 2025
