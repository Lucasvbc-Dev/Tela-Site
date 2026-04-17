# 🧪 Testes de Email - Exemplos Prontos

## 📧 Endpoints Disponíveis

### 1. POST `/api/comunicacao/contato`
**Envia email de contato para a loja**

#### cURL
```bash
curl -X POST http://localhost:8080/api/comunicacao/contato \
  -H \"Content-Type: application/json\" \
  -d '{
    \"nome\": \"João Silva\",
    \"email\": \"joao@example.com\",
    \"assunto\": \"Dúvida sobre frete\",
    \"mensagem\": \"Qual é o prazo de entrega para Fortaleza?\"
  }'
```

#### Resposta (Sucesso)
```http
HTTP/1.1 202 Accepted
```

#### Resposta (Erro)
```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  \"message\": \"SMTP_HOST nao configurado.\"
}
```

---

### 2. POST `/api/comunicacao/pedido-confirmacao`
**Envia confirmação de pedido para o cliente**

#### cURL
```bash
curl -X POST http://localhost:8080/api/comunicacao/pedido-confirmacao \
  -H \"Content-Type: application/json\" \
  -d '{
    \"pedidoId\": \"PED-2024-001\",
    \"nomeCliente\": \"Maria Santos\",
    \"emailCliente\": \"maria@example.com\",
    \"total\": 129.90,
    \"endereco\": \"Rua das Flores, 456 - Apto 201 - Fortaleza, CE 60000-000\",
    \"itens\": [
      {
        \"nome\": \"Camiseta Básica - Preto - M\",
        \"quantidade\": 2,
        \"preco\": 39.90
      },
      {
        \"nome\": \"Camiseta Premium - Branco - G\",
        \"quantidade\": 1,
        \"preco\": 69.90
      }
    ]
  }'
```

#### Resposta (Sucesso)
```http
HTTP/1.1 202 Accepted
```

#### Resposta (Erro - Email Cliente Inválido)
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  \"message\": \"E-mail do cliente inválido\"
}
```

---

## 🧑‍💻 JavaScript/TypeScript Examples

### Frontend - Enviar Contato

```typescript
// src/services/comunicacaoService.ts - JÁ IMPLEMENTADO
import api from './api';

export const comunicacaoService = {
  enviarContato: async (payload: ContatoPayload) => {
    try {
      const response = await api.post('/comunicacao/contato', payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao enviar contato';
      throw new Error(message);
    }
  },

  enviarConfirmacaoPedido: async (payload: ConfirmacaoPedidoPayload) => {
    try {
      const response = await api.post('/comunicacao/pedido-confirmacao', payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao enviar confirmação do pedido';
      throw new Error(message);
    }
  },
};
```

### React - Component de Contato

```tsx
// src/pages/Contato.tsx - JÁ IMPLEMENTADO
import { useState } from 'react';
import { comunicacaoService } from '@/services/comunicacaoService';
import { useToast } from '@/hooks/use-toast';

const Contato = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSending(true);
      await comunicacaoService.enviarContato({
        nome: formData.name,
        email: formData.email,
        assunto: formData.subject,
        mensagem: formData.message,
      });
      
      toast({ 
        title: 'Mensagem enviada', 
        description: 'Sua mensagem foi encaminhada para a loja.' 
      });
      
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error?.message || 'Não foi possível enviar sua mensagem agora.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type=\"submit\" disabled={isSending}>
        {isSending ? 'Enviando...' : 'Enviar Mensagem'}
      </button>
    </form>
  );
};
```

### React - Integração no Checkout

```tsx
// src/pages/Checkout.tsx - JÁ IMPLEMENTADO (TRECHO)
import { comunicacaoService } from '@/services/comunicacaoService';

const Checkout = () => {
  // ... código anterior ...
  
  // Este useEffect envia o email após o pedido ser confirmado
  useEffect(() => {
    if (!orderPlaced || !orderConfirmation || confirmationSent || confirmationAttempted) {
      return;
    }

    const enviarConfirmacao = async () => {
      setConfirmationAttempted(true);
      try {
        await comunicacaoService.enviarConfirmacaoPedido(orderConfirmation);
        setConfirmationSent(true);
        
        toast({ 
          title: 'Email de confirmação enviado', 
          description: 'Verifique seu email para detalhes do pedido.' 
        });
      } catch (error) {
        console.error('Erro ao enviar confirmação do pedido:', error);
        toast({
          title: 'Pedido confirmado, mas sem e-mail',
          description: 'Nossa equipe já recebeu seu pedido. Verificaremos o email mais tarde.',
          variant: 'destructive',
        });
      }
    };

    enviarConfirmacao();
  }, [orderPlaced, orderConfirmation, confirmationSent, confirmationAttempted, toast]);
};
```

---

## 🔍 Monitoramento e Debug

### Ativar Logs Detalhados

No `application.properties`:

```properties
# Logs do Spring Mail
logging.level.org.springframework.mail=DEBUG
logging.level.org.springframework.mail.javamail=DEBUG

# Logs do Jakarta Mail
logging.level.com.sun.mail=DEBUG
logging.level.jakarta.mail=DEBUG

# Logs da aplicação
logging.level.backendtela.service.EmailService=DEBUG
logging.level.backendtela.controller.ComunicacaoController=DEBUG
```

### Verificar Logs da Aplicação

```bash
# Executar e monitorar
tail -f logs/backendtela.log | grep -i email

# Ou com Docker
docker logs -f nome-container | grep -i email
```

### Logs Esperados (Sucesso)

```log
[INFO] backendtela.service.EmailService - Contato enviado para tela.contato123@gmail.com a partir de joao@example.com
[INFO] backendtela.service.EmailService - Email de confirmação enviado para maria@example.com referente ao pedido PED-2024-001
```

### Logs de Erro

```log
[ERROR] SMTP_HOST nao configurado.
[ERROR] Falha de autenticacao SMTP. Configure SMTP_USERNAME e SMTP_PASSWORD (senha de app).
[ERROR] Nao foi possivel enviar o e-mail. Verifique as configuracoes SMTP.
```

---

## 📊 Validações Realizadas

### ContatoMensagemDTO
- ✅ Nome: obrigatório
- ✅ Email: obrigatório e válido
- ✅ Assunto: obrigatório
- ✅ Mensagem: obrigatória

### ConfirmacaoPedidoEmailDTO
- ✅ Pedido ID: obrigatório
- ✅ Nome Cliente: obrigatório
- ✅ Email Cliente: obrigatório e válido
- ✅ Total: obrigatório
- ✅ Itens: lista não vazia
  - ✅ Nome do item: obrigatório
  - ✅ Quantidade: obrigatória
  - ✅ Preço: obrigatório
- ✅ Endereço: opcional

---

## 🚀 Teste Manual Completo

### Pré-requisitos
- Backend rodando em http://localhost:8080
- Frontend rodando em http://localhost:5173
- Gmail configurado com senha de app

### Passo a Passo

**1. Teste de Contato**
```
1. Abra http://localhost:5173/contato
2. Preencha o formulário:
   - Nome: \"Seu Nome\"
   - Email: \"seu-email@gmail.com\"
   - Assunto: \"Teste de Email\"
   - Mensagem: \"Este é um teste do sistema de email\"
3. Clique em \"Enviar Mensagem\"
4. Verifique a mensagem de sucesso
5. Abra http://mail.google.com e procure o email em tela.contato123@gmail.com
6. ✅ Verifique se o email está formatado corretamente
```

**2. Teste de Pedido Completo**
```
1. Faça login no http://localhost:5173
2. Adicione itens ao carrinho
3. Vá para checkout
4. Preencha endereço de entrega
5. Escolha método de pagamento (PIX ou Cartão)
6. Finalize a compra
7. Espere confirmação de pagamento
8. Abra seu email pessoal
9. ✅ Verifique se recebeu email de confirmação do pedido
10. ✅ Verifique formatação, itens, total e endereço
```

---

## 📱 Testar em Diferentes Clientes de Email

- ✅ Gmail (Web e App)
- ✅ Outlook (Web e Outlook Client)
- ✅ Apple Mail
- ✅ Thunderbird
- ✅ Aplicativos de Email Mobile

**Observação:** Os templates são 100% compatíveis com todos os clientes principais. Responsivos em dispositivos móveis.

---

## 🔗 Checklist Final

- [ ] Backend compilado e rodando
- [ ] Variáveis SMTP configuradas
- [ ] Teste de contato enviando email
- [ ] Teste de confirmação de pedido enviando email
- [ ] Emails formatados corretamente
- [ ] Sem erros nos logs
- [ ] Responder email funciona (reply-to configurado)
- [ ] Testes em 2+ clientes de email

---

**Última atualização:** 16 de abril de 2025
