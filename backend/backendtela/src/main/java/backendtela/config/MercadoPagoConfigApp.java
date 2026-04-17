package backendtela.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import com.mercadopago.MercadoPagoConfig;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class MercadoPagoConfigApp {

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    @Value("${mercadopago.public-key:}")
    private String publicKey;

    @PostConstruct
    public void init() {
        String normalizedAccessToken = normalizeCredential(accessToken);
        if (!normalizedAccessToken.isBlank()) {
            MercadoPagoConfig.setAccessToken(normalizedAccessToken);
            log.info("MercadoPago configurado com token de acesso (len={}, prefix={}...)",
                    normalizedAccessToken.length(),
                    maskPrefix(normalizedAccessToken));
        } else {
            log.warn("⚠️  MercadoPago: Token de acesso não configurado. Endpoints de pagamento não funcionarão.");
        }

        String normalizedPublicKey = normalizeCredential(publicKey);
        if (!normalizedPublicKey.isBlank()) {
            log.info("MercadoPago: Public key configurada (len={}, prefix={}...)",
                    normalizedPublicKey.length(),
                    maskPrefix(normalizedPublicKey));
        }
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

    private String maskPrefix(String token) {
        return token.substring(0, Math.min(12, token.length()));
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getPublicKey() {
        return publicKey;
    }
}

