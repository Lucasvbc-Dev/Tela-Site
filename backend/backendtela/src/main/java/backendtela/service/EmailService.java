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
                builder.append("<html><body style=\"font-family: Arial, sans-serif; color: #111827; line-height: 1.6;\">")
                                .append("<h2 style=\"margin-bottom: 8px;\">Nova mensagem de contato</h2>")
                                .append("<p><strong>Nome:</strong> ").append(sanitizar(dto.getNome())).append("</p>")
                                .append("<p><strong>E-mail:</strong> ").append(sanitizar(dto.getEmail())).append("</p>")
                                .append("<p><strong>Assunto:</strong> ").append(sanitizar(dto.getAssunto())).append("</p>")
                                .append("<p><strong>Mensagem:</strong></p>")
                                .append("<div style=\"padding: 16px; background: #f8fafc; border-left: 4px solid #111827;\">")
                                .append(sanitizar(dto.getMensagem()).replace("\n", "<br />"))
                                .append("</div></body></html>");
                return builder.toString();
    }

    private String montarCorpoConfirmacaoPedido(ConfirmacaoPedidoEmailDTO dto) {
        NumberFormat currency = NumberFormat.getCurrencyInstance(java.util.Locale.of("pt", "BR"));
        StringBuilder itensBuilder = new StringBuilder();
        for (var item : dto.getItens()) {
            itensBuilder.append("<li>")
                .append(sanitizar(item.getNome()))
                .append(" - ")
                .append(item.getQuantidade())
                .append("x ")
                .append(currency.format(item.getPreco()))
                .append("</li>");
        }

        StringBuilder builder = new StringBuilder();
        builder.append("<html><body style=\"font-family: Arial, sans-serif; color: #111827; line-height: 1.7;\">")
            .append("<p>Olá, ").append(sanitizar(dto.getNomeCliente())).append(".</p>")
            .append("<p>Recebemos e confirmamos o pagamento do pedido <strong>#").append(sanitizar(dto.getPedidoId())).append("</strong>.</p>")
            .append("<ul style=\"padding-left: 20px;\">").append(itensBuilder).append("</ul>")
            .append("<p><strong>Total:</strong> ").append(currency.format(dto.getTotal())).append("</p>")
            .append("<p><strong>Endereço de entrega:</strong> ")
            .append(sanitizar(dto.getEndereco() == null || dto.getEndereco().isBlank() ? "nao informado" : dto.getEndereco()))
            .append("</p>")
            .append("<p>Obrigado por comprar com a Tela. Em breve seu pedido seguirá para separação.</p>")
            .append("</body></html>");
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