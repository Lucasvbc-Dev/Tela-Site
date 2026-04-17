package backendtela.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Diagnóstico de configurações em produção (sem expor valores sensíveis).
 * Use apenas em ambiente de debug; pode ser removido após validar todas as configs.
 */
@RestController
@RequestMapping("/diagnose")
public class DiagnoseController {

    private final JavaMailSender mailSender;

    public DiagnoseController(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:587}")
    private String mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @Value("${spring.mail.properties.mail.smtp.auth:}")
    private String smtpAuth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:}")
    private String smtpStarttls;

    @Value("${mercadopago.access-token:}")
    private String mercadopagoAccessToken;

    @Value("${mercadopago.public-key:}")
    private String mercadopagoPublicKey;

    @GetMapping("/smtp")
    public ResponseEntity<?> diagnoseSMTP() {
        Map<String, Object> result = new HashMap<>();

        String normalizedMailHost = normalizeCredential(mailHost);
        String normalizedMailPort = normalizeCredential(mailPort);
        String normalizedMailUsername = normalizeCredential(mailUsername);
        String normalizedMailPassword = normalizeCredential(mailPassword);
        String normalizedSmtpAuth = normalizeCredential(smtpAuth);
        String normalizedSmtpStarttls = normalizeCredential(smtpStarttls);

        result.put("SMTP_HOST", normalizedMailHost.isBlank() ? "NOT_CONFIGURED" : "OK " + normalizedMailHost);
        result.put("SMTP_PORT", normalizedMailPort.isBlank() ? "NOT_CONFIGURED" : "OK " + normalizedMailPort);
        result.put("SMTP_USERNAME", normalizedMailUsername.isBlank() ? "NOT_CONFIGURED" : "OK " + maskEmail(normalizedMailUsername));
        result.put("SMTP_PASSWORD", normalizedMailPassword.isBlank() ? "NOT_CONFIGURED" : "OK [" + normalizedMailPassword.length() + " chars]");
        result.put("SMTP_AUTH", normalizedSmtpAuth.isBlank() ? "NOT_CONFIGURED" : "OK " + normalizedSmtpAuth);
        result.put("SMTP_STARTTLS", normalizedSmtpStarttls.isBlank() ? "NOT_CONFIGURED" : "OK " + normalizedSmtpStarttls);

        // Indicador geral
        boolean allConfigured = !normalizedMailHost.isBlank() && !normalizedMailPort.isBlank()
                && !normalizedMailUsername.isBlank() && !normalizedMailPassword.isBlank();
        result.put("STATUS_GERAL", allConfigured ? "READY_TO_SEND" : "MISSING_CONFIGURATION");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/smtp-test")
    public ResponseEntity<?> testSmtpConnection() {
        Map<String, Object> result = new HashMap<>();
        result.put("SMTP_HOST", normalizeCredential(mailHost));
        result.put("SMTP_PORT", normalizeCredential(mailPort));
        result.put("SMTP_USERNAME", maskEmail(normalizeCredential(mailUsername)));

        if (!(mailSender instanceof JavaMailSenderImpl senderImpl)) {
            result.put("STATUS", "ERROR");
            result.put("DETAIL", "JavaMailSender implementation does not support testConnection().");
            return ResponseEntity.status(500).body(result);
        }

        try {
            senderImpl.testConnection();
            result.put("STATUS", "OK");
            result.put("DETAIL", "SMTP connection established successfully.");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("STATUS", "ERROR");
            result.put("DETAIL", extractRootMessage(e));
            return ResponseEntity.status(503).body(result);
        }
    }

    @GetMapping("/mercadopago")
    public ResponseEntity<?> diagnoseMercadoPago() {
        Map<String, Object> result = new HashMap<>();

        String normalizedAccessToken = normalizeCredential(mercadopagoAccessToken);
        String normalizedPublicKey = normalizeCredential(mercadopagoPublicKey);

        result.put("MERCADOPAGO_ACCESS_TOKEN", normalizedAccessToken.isBlank() ? "NOT_CONFIGURED" : "OK " + maskPrefix(normalizedAccessToken));
        result.put("MERCADOPAGO_PUBLIC_KEY", normalizedPublicKey.isBlank() ? "NOT_CONFIGURED" : "OK " + maskPrefix(normalizedPublicKey));
        result.put("ACCESS_TOKEN_TYPE", normalizedAccessToken.startsWith("APP_USR-") ? "LIVE" : (normalizedAccessToken.startsWith("TEST-") ? "TEST" : "UNKNOWN"));
        result.put("PUBLIC_KEY_TYPE", normalizedPublicKey.startsWith("APP_USR-") ? "LIVE" : (normalizedPublicKey.startsWith("TEST-") ? "TEST" : "UNKNOWN"));

        boolean allConfigured = !normalizedAccessToken.isBlank() && !normalizedPublicKey.isBlank();
        result.put("STATUS_GERAL", allConfigured ? "READY_FOR_PAYMENTS" : "MISSING_CONFIGURATION");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/all")
    public ResponseEntity<?> diagnoseAll() {
        Map<String, Object> result = new HashMap<>();
        result.put("SMTP", diagnoseSMTP().getBody());
        result.put("MERCADOPAGO", diagnoseMercadoPago().getBody());
        return ResponseEntity.ok(result);
    }

    private String maskEmail(String email) {
        if (email == null || email.length() < 5) {
            return email;
        }
        int atIndex = email.indexOf('@');
        if (atIndex > 1) {
            return email.charAt(0) + "***" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(email.length() - 2);
    }

    private String maskPrefix(String token) {
        if (token == null || token.length() < 20) {
            return token;
        }
        return token.substring(0, 12) + "..." + token.substring(token.length() - 4);
    }

    private String normalizeCredential(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.trim();
        if ((normalized.startsWith("\"") && normalized.endsWith("\""))
                || (normalized.startsWith("'") && normalized.endsWith("'"))) {
            normalized = normalized.substring(1, normalized.length() - 1).trim();
        }
        return normalized;
    }

    private String extractRootMessage(Throwable throwable) {
        Throwable current = throwable;
        String lastMessage = "Unknown SMTP error";
        while (current != null) {
            if (current.getMessage() != null && !current.getMessage().isBlank()) {
                lastMessage = current.getMessage();
            }
            current = current.getCause();
        }
        return lastMessage;
    }
}
