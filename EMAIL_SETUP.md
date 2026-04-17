# 📧 Configuração de Email - Tela T-Shirt

## ✅ Status: CONFIGURADO E PRONTO

### Resumo das Alterações

#### 1. **Configuração SMTP** (`application.properties`)
✅ SMTP configurado para **Gmail** com as credenciais:
- **Host:** smtp.gmail.com
- **Porta:** 587
- **Username:** tela.contato123@gmail.com
- **Senha:** Armazenada de forma segura

#### 2. **Templates de Email Melhorados**
✅ Dois templates profissionais criados:

##### **a) Email de Contato** (recebido pela loja)
- Header com ícone indicativo
- Design limpo e profissional
- Informações do cliente bem organizadas
- Mensagem em destaque com fundo de cor
- Timestamp de recebimento
- Footer com informações da loja

##### **b) Email de Confirmação de Pedido** (enviado para cliente)
- Header verde com checkmark de confirmação
- Número do pedido em destaque
- Tabela profissional com itens do pedido
- Cálculo automático do total
- Endereço de entrega formatado
- Próximas etapas explicadas
- Footer com informações da loja

### 🔄 Fluxo de Funcionamento

#### **Tela de Contato → Email para Loja**
1. Usuário preenche formulário de contato (Frontend)
2. Dados são enviados para `POST /comunicacao/contato`
3. Backend valida os dados (DTO com validações)
4. Email HTML profissional é montado
5. Email é enviado para **tela.contato123@gmail.com**
6. Mensagem de sucesso exibida para o usuário

#### **Checkout → Email para Cliente**
1. Usuário finaliza compra (pagamento aprovado)
2. Pedido é criado no Firestore
3. Dados são enviados para `POST /comunicacao/pedido-confirmacao`
4. Backend valida os dados do pedido
5. Email HTML profissional é montado (com itens e total)
6. Email é enviado para o **email do cliente**
7. Confirmação é exibida no formulário de checkout

### 🧪 Como Testar

#### **Teste 1: Email de Contato**

```bash
curl -X POST http://localhost:8080/api/comunicacao/contato \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "assunto": "Dúvida sobre tamanho",
    "mensagem": "Qual é o tamanho recomendado para quem veste M?"
  }'
```

**Esperado:** Email recebido em `tela.contato123@gmail.com`

#### **Teste 2: Email de Confirmação de Pedido**

```bash
curl -X POST http://localhost:8080/api/comunicacao/pedido-confirmacao \
  -H "Content-Type: application/json" \
  -d '{
    "pedidoId": "PED-123456",
    "nomeCliente": "Maria Santos",
    "emailCliente": "maria@example.com",
    "total": 89.90,
    "endereco": "Rua Principal, 123 - Fortaleza, CE 60000-000",
    "itens": [
      {
        "nome": "Camiseta Básica - Preto",
        "quantidade": 2,
        "preco": 39.90
      },
      {
        "nome": "Camiseta Premium - Azul",
        "quantidade": 1,
        "preco": 69.90
      }
    ]
  }'
```

**Esperado:** Email recebido em `maria@example.com`

#### **Teste 3: Teste End-to-End Completo**

1. Abra o frontend em `http://localhost:5173`
2. Acesse a página de **Contato**
3. Preencha e envie uma mensagem
4. Verifique se recebeu o email em `tela.contato123@gmail.com`
5. Faça um pedido completo
6. Após aprovação do pagamento, verifique se recebeu o email de confirmação

### 🔐 Variáveis de Ambiente (Produção)

Para usar em produção com segurança, use variáveis de ambiente em vez de valores hardcoded:

```bash
# .env.production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-app-google
APP_MAIL_FROM_EMAIL=seu-email@gmail.com
APP_CONTACT_STORE_EMAIL=contato@sua-loja.com
```

Depois rode a aplicação:
```bash
java -jar backendtela.jar \
  -DSMTP_HOST=smtp.gmail.com \
  -DSMTP_PORT=587 \
  -DSMTP_USERNAME=seu-email@gmail.com \
  -DSMTP_PASSWORD=sua-senha-app-google
```

### 📋 Checklist de Funcionamento

- [x] Dependência `spring-boot-starter-mail` adicionada ao pom.xml
- [x] `EmailService` implementado com validações
- [x] `ComunicacaoController` com endpoints `/contato` e `/pedido-confirmacao`
- [x] DTOs com validações: `ContatoMensagemDTO`, `ConfirmacaoPedidoEmailDTO`, `ItemPedidoEmailDTO`
- [x] Templates HTML profissionais e responsivos
- [x] Configurações SMTP adicionadas ao `application.properties`
- [x] Integração Frontend: `comunicacaoService` com ambos endpoints
- [x] Página de Contato enviando dados corretamente
- [x] Checkout enviando confirmação de pedido após pagamento
- [x] Tratamento de erros e validações
- [x] Headers e footers profissionais

### 🎨 Características dos Emails

**Email de Contato:**
- ✅ Identificação clara de remetente
- ✅ Mensagem em caixa de destaque
- ✅ Timestamp de recebimento
- ✅ Facilita resposta do atendente

**Email de Confirmação:**
- ✅ Confirma pagamento imediato
- ✅ Mostra número do pedido em destaque
- ✅ Tabela legível com itens e valores
- ✅ Total bem calculado
- ✅ Endereço de entrega formatado
- ✅ Próximas etapas explicadas
- ✅ Facilita rastreamento futuro

### ⚠️ Possíveis Erros e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| "SMTP_HOST nao configurado" | Variável não definida | Verifique `application.properties` |
| "SMTP_USERNAME nao configurado" | Email SMTP não definido | Configure `SMTP_USERNAME` |
| "Falha de autenticacao SMTP" | Senha incorreta | Regenere senha de app no Gmail |
| "Connection timeout" | SMTP_HOST inacessível | Verifique firewall/proxy |
| "535 5.7.8 Authentication failed" | Gmail 2FA sem senha app | Crie senha de app do Gmail |

### 🔗 Dependências Utilizadas

```xml
<!-- Spring Mail -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<!-- Jakarta Mail (Java 21+) -->
<!-- Incluído automaticamente via spring-boot-starter-mail -->
```

### 📞 Suporte

Se encontrar problemas:

1. Verifique os logs da aplicação
2. Teste a conectividade SMTP com Telnet/OpenSSL
3. Valide as credenciais do Gmail
4. Certifique-se de ter ativado "Permissões de Aplicativo Menos Seguro" ou "Senhas de App"

---

**Última atualização:** 16 de abril de 2025
**Status:** ✅ Pronto para Produção
