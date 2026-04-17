package backendtela.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
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

        result.put("SMTP_HOST", mailHost.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ " + mailHost);
        result.put("SMTP_PORT", mailPort.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ " + mailPort);
        result.put("SMTP_USERNAME", mailUsername.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ " + maskEmail(mailUsername));
        result.put("SMTP_PASSWORD", mailPassword.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ [" + mailPassword.length() + " chars]");
        result.put("SMTP_AUTH", smtpAuth.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ " + smtpAuth);
        result.put("SMTP_STARTTLS", smtpStarttls.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ " + smtpStarttls);

        // Indicador geral
        boolean allConfigured = !mailHost.isBlank() && !mailPort.isBlank() && !mailUsername.isBlank() && !mailPassword.isBlank();
        result.put("STATUS_GERAL", allConfigured ? "✅ PRONTO PARA ENVIO" : "❌ FALTA CONFIGURAÇÃO");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/mercadopago")
    public ResponseEntity<?> diagnoseMercadoPago() {
        Map<String, Object> result = new HashMap<>();

        result.put("MERCADOPAGO_ACCESS_TOKEN", mercadopagoAccessToken.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ " + maskPrefix(mercadopagoAccessToken));
        result.put("MERCADOPAGO_PUBLIC_KEY", mercadopagoPublicKey.isBlank() ? "❌ NÃO CONFIGURADO" : "✅ " + maskPrefix(mercadopagoPublicKey));

        boolean allConfigured = !mercadopagoAccessToken.isBlank() && !mercadopagoPublicKey.isBlank();
        result.put("STATUS_GERAL", allConfigured ? "✅ PRONTO PARA PAGAMENTOS" : "❌ FALTA CONFIGURAÇÃO");

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
}
