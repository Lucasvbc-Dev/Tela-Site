# 🔐 Guia: Configurar Senha de App do Gmail para SMTP

> **⚠️ IMPORTANTE:** Use este guia para gerar uma **senha de app** segura do Gmail. Não use sua senha pessoal no servidor!

## 📋 Pré-requisitos

- Conta Gmail ativa
- Autenticação de Dois Fatores (2FA) ativada na conta
- Acesso à página de segurança do Google

## 🚀 Passo 1: Ativar Autenticação de Dois Fatores

1. Acesse: https://myaccount.google.com/security
2. Clique em **"Autenticação de dois fatores"**
3. Siga as instruções para ativar
4. Confirme com seu telefone

## 🔑 Passo 2: Gerar Senha de App

### Método Recomendado (SEGURO):

1. Acesse: https://myaccount.google.com/apppasswords
   - Você será redirecionado para clicar em "Segurança"
   
2. Se não aparecer "Senhas de app":
   - Verifique se você ativou 2FA (Passo 1)
   - Tente acessar diretamente: https://myaccount.google.com/apppasswords

3. Na tela "Senhas de app":
   - **Selecione o aplicativo:** "Correo eletrônico"
   - **Selecione o dispositivo:** "Windows" (ou seu SO)
   - Clique em **"Gerar"**

4. O Google exibirá uma senha de 16 caracteres (2 grupos de 8)
   - Exemplo: `rzfyqydzadtwktvh` (sem espaços na configuração)

## 📝 Passo 3: Configurar no Backend

### Opção A: Arquivo `application.properties` (Desenvolvimento)

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=seu-email@gmail.com
spring.mail.password=rzfyqydzadtwktvh
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

### Opção B: Variáveis de Ambiente (Recomendado - Produção)

```bash
# Linux/Mac
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USERNAME=seu-email@gmail.com
export SMTP_PASSWORD=sua-senha-app-16-caracteres

# Windows PowerShell
$env:SMTP_HOST="smtp.gmail.com"
$env:SMTP_PORT="587"
$env:SMTP_USERNAME="seu-email@gmail.com"
$env:SMTP_PASSWORD="sua-senha-app-16-caracteres"

# Executar aplicação
java -jar backendtela.jar
```

### Opção C: Docker Compose

```yaml
version: '3.8'
services:
  backend:
    image: backendtela:latest
    environment:
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USERNAME: seu-email@gmail.com
      SMTP_PASSWORD: sua-senha-app-16-caracteres
      APP_MAIL_FROM_EMAIL: seu-email@gmail.com
      APP_CONTACT_STORE_EMAIL: contato@tela.com
```

## ✅ Testar a Configuração

### Teste 1: Verificar Conectividade

```bash
# Telnet (se disponível)
telnet smtp.gmail.com 587

# Ou com OpenSSL
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
```

### Teste 2: Enviar Email de Teste

```bash
curl -X POST http://localhost:8080/api/comunicacao/contato \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste",
    "email": "seu-email@gmail.com",
    "assunto": "Teste SMTP",
    "mensagem": "Se recebeu este email, SMTP está funcionando!"
  }'
```

## 🔍 Verificar Senhas de App Geradas

1. Acesse: https://myaccount.google.com/apppasswords
2. Você verá todas as senhas de app geradas
3. Pode deletar senhas antigas que não usa mais
4. Cada senha funciona apenas para uma aplicação/dispositivo

## ⚠️ Segurança

### ✅ Faça:
- Use senhas de app em servidores de produção
- Armazene senhas em variáveis de ambiente
- Regenere a senha se ela vazar
- Use diferentes senhas para diferentes ambientes

### ❌ Não Faça:
- NÃO commit de senhas no Git
- NÃO use sua senha pessoal do Gmail
- NÃO compartilhe senhas de app
- NÃO deixe senhas hardcoded em `application.properties` em produção

## 🆘 Troubleshooting

### "Email de app não aparece em Senhas de app"

**Solução:**
1. Verifique se 2FA está ativado
2. Tente sair e logar novamente
3. Acesse: https://accounts.google.com/security-checkup

### "535 5.7.8 Authentication failed"

**Solução:**
1. Verifique se a senha tem 16 caracteres
2. Não adicione espaços ao copiar a senha
3. Regenere a senha
4. Verifique se não há caracteres especiais faltando

### "Could not connect to SMTP host"

**Solução:**
1. Verifique a porta (587 para TLS)
2. Verifique firewall/proxy
3. Teste com: `telnet smtp.gmail.com 587`
4. Tente porta 465 para SSL (não recomendado)

### "Permissão negada: Você não pode enviar de"

**Solução:**
1. Verifique se `SMTP_USERNAME` é igual a `APP_MAIL_FROM_EMAIL`
2. Não envie de emails diferentes do configurado

## 📚 Referências

- [Google Cloud - Enviar emails via SMTP](https://support.google.com/a/answer/176600?hl=pt-BR)
- [Spring Boot - Mail Configuration](https://spring.io/guides/gs/sending-email/)
- [Gmail - Senhas de app](https://myaccount.google.com/apppasswords)

---

**Última atualização:** 16 de abril de 2025
