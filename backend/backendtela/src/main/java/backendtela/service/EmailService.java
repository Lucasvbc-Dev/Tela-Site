package backendtela.service;

import java.nio.charset.StandardCharsets;
import java.io.UnsupportedEncodingException;
import java.text.NumberFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import backendtela.dto.ConfirmacaoPedidoEmailDTO;
import backendtela.dto.ContatoMensagemDTO;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.contact.store-email:tela.contato123@gmail.com}")
    private String storeEmail;

    @Value("${app.mail.from-name:Tela}")
    private String fromName;

    @Value("${app.mail.from-email:}")
    private String fromEmail;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarContato(ContatoMensagemDTO dto) {
        String assunto = "Contato do site: " + dto.getAssunto();
        String corpo = montarCorpoContato(dto);

        enviarEmail(storeEmail, assunto, corpo, dto.getEmail());
        log.info("Contato enviado para {} a partir de {}", storeEmail, dto.getEmail());
    }

    public void enviarConfirmacaoPedido(ConfirmacaoPedidoEmailDTO dto) {
        String assunto = "Confirmação do pedido " + dto.getPedidoId() + " - Tela";
        String corpo = montarCorpoConfirmacaoPedido(dto);

        enviarEmail(dto.getEmailCliente(), assunto, corpo, storeEmail);
        log.info("Email de confirmação enviado para {} referente ao pedido {}", dto.getEmailCliente(), dto.getPedidoId());
    }

    private void enviarEmail(String destino, String assunto, String html, String replyTo) {
        validarConfiguracaoEmail();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setTo(destino);
            helper.setFrom(obterRemetente(), fromName);
            helper.setSubject(assunto);
            helper.setText(html, true);
            if (replyTo != null && !replyTo.isBlank()) {
                helper.setReplyTo(replyTo);
            }

            mailSender.send(message);
        } catch (MailException | jakarta.mail.MessagingException | UnsupportedEncodingException e) {
            String detalhe = e.getMessage() == null ? "" : e.getMessage();
            if (detalhe.toLowerCase().contains("authentication") || detalhe.toLowerCase().contains("no password specified")) {
                throw new IllegalStateException("Falha de autenticacao SMTP. Configure SMTP_USERNAME e SMTP_PASSWORD (senha de app).", e);
            }
            throw new IllegalStateException("Nao foi possivel enviar o e-mail. Verifique as configuracoes SMTP.", e);
        }
    }

    private void validarConfiguracaoEmail() {
        if (mailHost == null || mailHost.isBlank()) {
            throw new IllegalStateException("SMTP_HOST nao configurado.");
        }

        if (mailUsername == null || mailUsername.isBlank()) {
            throw new IllegalStateException("SMTP_USERNAME nao configurado.");
        }

        if (mailPassword == null || mailPassword.isBlank()) {
            throw new IllegalStateException("SMTP_PASSWORD nao configurado.");
        }
    }

    private String montarCorpoContato(ContatoMensagemDTO dto) {
        StringBuilder builder = new StringBuilder();
        builder.append("<!DOCTYPE html>\n")
                .append("<html>\n")
                .append("<head>\n")
                .append("<meta charset=\"UTF-8\">\n")
                .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
                .append("<style>\n")
                .append("  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }\n")
                .append("  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }\n")
                .append("  .header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); color: #ffffff; padding: 40px 20px; text-align: center; }\n")
                .append("  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }\n")
                .append("  .content { padding: 40px; }\n")
                .append("  .message-box { background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }\n")
                .append("  .label { font-weight: 600; color: #111827; margin-top: 15px; margin-bottom: 5px; }\n")
                .append("  .value { color: #4b5563; line-height: 1.6; }\n")
                .append("  .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }\n")
                .append("  .brand { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 10px; }\n")
                .append("</style>\n")
                .append("</head>\n")
                .append("<body>\n")
                .append("<div class=\"container\">\n")
                .append("  <div class=\"header\">\n")
                .append("    <h1> Nova Mensagem de Contato</h1>\n")
                .append("  </div>\n")
                .append("  <div class=\"content\">\n")
                .append("    <p style=\"color: #111827; font-size: 14px; margin: 0 0 20px 0;\">Você recebeu uma nova mensagem através do formulário de contato do site:</p>\n")
                .append("    <div class=\"label\"> De:</div>\n")
                .append("    <div class=\"value\">").append(sanitizar(dto.getNome())).append(" (").append(sanitizar(dto.getEmail())).append(")</div>\n")
                .append("    <div class=\"label\"> Assunto:</div>\n")
                .append("    <div class=\"value\">").append(sanitizar(dto.getAssunto())).append("</div>\n")
                .append("    <div class=\"label\"> Mensagem:</div>\n")
                .append("    <div class=\"message-box\">").append(sanitizar(dto.getMensagem()).replace("\n", "<br />")).append("</div>\n")
                .append("    <p style=\"color: #6b7280; font-size: 13px; margin-top: 30px; margin-bottom: 0;\"> Recebido em: ").append(new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new java.util.Date())).append("</p>\n")
                .append("  </div>\n")
                .append("  <div class=\"footer\">\n")
                .append("    <div class=\"brand\">Tela T-Shirt</div>\n")
                .append("    <p style=\"margin: 10px 0 0 0;\">Este é um email automático. Responda para: ").append(sanitizar(dto.getEmail())).append("</p>\n")
                .append("  </div>\n")
                .append("</div>\n")
                .append("</body>\n")
                .append("</html>");
        return builder.toString();
    }

    private String montarCorpoConfirmacaoPedido(ConfirmacaoPedidoEmailDTO dto) {
        NumberFormat currency = NumberFormat.getCurrencyInstance(java.util.Locale.of("pt", "BR"));
        StringBuilder itensBuilder = new StringBuilder();
        
        for (var item : dto.getItens()) {
            itensBuilder.append("  <tr style=\"border-bottom: 1px solid #e5e7eb;\">\n")
                .append("    <td style=\"padding: 12px; color: #111827;\">").append(sanitizar(item.getNome())).append("</td>\n")
                .append("    <td style=\"padding: 12px; text-align: center; color: #111827;\">").append(item.getQuantidade()).append("x</td>\n")
                .append("    <td style=\"padding: 12px; text-align: right; color: #111827;\">").append(currency.format(item.getPreco())).append("</td>\n")
                .append("  </tr>\n");
        }

        StringBuilder builder = new StringBuilder();
        builder.append("<!DOCTYPE html>\n")
            .append("<html>\n")
            .append("<head>\n")
            .append("<meta charset=\"UTF-8\">\n")
            .append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
            .append("<style>\n")
            .append("  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }\n")
            .append("  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }\n")
            .append("  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 40px 20px; text-align: center; }\n")
            .append("  .header h1 { margin: 0; font-size: 28px; font-weight: 700; }\n")
            .append("  .header-icon { font-size: 40px; margin-bottom: 10px; }\n")
            .append("  .content { padding: 30px 20px; }\n")
            .append("  .greeting { font-size: 16px; color: #111827; margin-bottom: 10px; }\n")
            .append("  .order-id { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }\n")
            .append("  .order-id strong { color: #059669; font-size: 18px; }\n")
            .append("  .section-title { font-weight: 600; color: #111827; margin-top: 25px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }\n")
            .append("  table { width: 100%; border-collapse: collapse; margin: 15px 0; }\n")
            .append("  .total-row { background-color: #f9fafb; font-weight: 700; font-size: 16px; color: #111827; }\n")
            .append("  .total-row td { padding: 15px 12px; }\n")
            .append("  .address-box { background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 15px 0; }\n")
            .append("  .address-box strong { color: #111827; display: block; margin-bottom: 8px; }\n")
            .append("  .address-box p { margin: 0; color: #4b5563; }\n")
            .append("  .cta-button { display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: 600; margin-top: 20px; }\n")
            .append("  .footer { background-color: #f3f4f6; padding: 25px 20px; text-align: center; border-top: 1px solid #e5e7eb; }\n")
            .append("  .footer-text { font-size: 12px; color: #6b7280; margin: 5px 0; }\n")
            .append("  .brand { font-size: 16px; font-weight: 700; color: #059669; margin-bottom: 8px; }\n")
            .append("</style>\n")
            .append("</head>\n")
            .append("<body>\n")
            .append("<div class=\"container\">\n")
            .append("  <div class=\"header\">\n")
            .append("    <div class=\"header-icon\">✅</div>\n")
            .append("    <h1>Pedido Confirmado!</h1>\n")
            .append("  </div>\n")
            .append("  <div class=\"content\">\n")
            .append("    <div class=\"greeting\">Olá <strong>").append(sanitizar(dto.getNomeCliente())).append("</strong>,</div>\n")
            .append("    <p style=\"color: #4b5563; line-height: 1.6; margin: 10px 0;\">Recebemos e confirmamos o pagamento do seu pedido. Sua compra foi processada com sucesso e em breve será preparada para envio!</p>\n")
            .append("    <div class=\"order-id\">\n")
            .append("      Número do Pedido: <strong>#").append(sanitizar(dto.getPedidoId())).append("</strong>\n")
            .append("    </div>\n")
            .append("    <div class=\"section-title\">📦 Itens do Pedido</div>\n")
            .append("    <table>\n")
            .append("      <thead>\n")
            .append("        <tr style=\"border-bottom: 2px solid #e5e7eb;\">\n")
            .append("          <th style=\"padding: 12px; text-align: left; color: #6b7280; font-weight: 600;\">Produto</th>\n")
            .append("          <th style=\"padding: 12px; text-align: center; color: #6b7280; font-weight: 600;\">Quantidade</th>\n")
            .append("          <th style=\"padding: 12px; text-align: right; color: #6b7280; font-weight: 600;\">Valor</th>\n")
            .append("        </tr>\n")
            .append("      </thead>\n")
            .append("      <tbody>\n")
            .append(itensBuilder)
            .append("      </tbody>\n")
            .append("      <tfoot>\n")
            .append("        <tr class=\"total-row\">\n")
            .append("          <td colspan=\"2\" style=\"padding: 15px 12px;\">TOTAL</td>\n")
            .append("          <td style=\"padding: 15px 12px; text-align: right;\">").append(currency.format(dto.getTotal())).append("</td>\n")
            .append("        </tr>\n")
            .append("      </tfoot>\n")
            .append("    </table>\n")
            .append("    <div class=\"section-title\">📍 Endereço de Entrega</div>\n")
            .append("    <div class=\"address-box\">\n")
            .append("      <strong>Endereço</strong>\n")
            .append("      <p>").append(sanitizar(dto.getEndereco() == null || dto.getEndereco().isBlank() ? "Não informado" : dto.getEndereco())).append("</p>\n")
            .append("    </div>\n")
            .append("    <p style=\"color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 25px;\">\n")
            .append("      <strong>⏱️ Próximas etapas:</strong><br>\n")
            .append("      1. Seu pedido será preparado para envio<br>\n")
            .append("      2. Você receberá um código de rastreamento por email<br>\n")
            .append("      3. Acompanhe seu pedido até a entrega\n")
            .append("    </p>\n")
            .append("    <p style=\"color: #6b7280; font-size: 13px; margin-top: 20px; margin-bottom: 0;\">Tem dúvidas? Entre em contato conosco em <strong>tela.contato123@gmail.com</strong></p>\n")
            .append("  </div>\n")
            .append("  <div class=\"footer\">\n")
            .append("    <div class=\"brand\">Tela T-Shirt</div>\n")
            .append("    <div class=\"footer-text\">Obrigado por comprar conosco! 🎉</div>\n")
            .append("    <div class=\"footer-text\">Rua Leonardo Mota, 1234 | Fortaleza, CE</div>\n")
            .append("    <div class=\"footer-text\">© 2025 Tela T-Shirt. Todos os direitos reservados.</div>\n")
            .append("  </div>\n")
            .append("</div>\n")
            .append("</body>\n")
            .append("</html>");
        return builder.toString();
    }

    private String sanitizar(String value) {
        return value == null ? "" : value.replace("<", "&lt;").replace(">", "&gt;").trim();
    }

    private String obterRemetente() {
        if (fromEmail != null && !fromEmail.isBlank()) {
            return fromEmail.trim();
        }

        if (mailUsername != null && !mailUsername.isBlank()) {
            return mailUsername.trim();
        }

        return storeEmail;
    }
}