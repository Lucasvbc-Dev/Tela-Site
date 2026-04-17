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

    @Value("${mercadopago.live-access-token-fallback:APP_USR-3522191199489875-033010-2fdff1256ff5d3c7dcef1929ea31b7b2-731993734}")
    private String liveAccessTokenFallback;

    @PostConstruct
    public void init() {
        String normalizedPublicKey = normalizeCredential(publicKey);
        String normalizedAccessToken = resolveAccessToken(normalizeCredential(accessToken), normalizedPublicKey);

        validarCompatibilidadeCredenciais(normalizedAccessToken, normalizedPublicKey);

        if (!normalizedAccessToken.isBlank()) {
            MercadoPagoConfig.setAccessToken(normalizedAccessToken);
            log.info("MercadoPago configurado com token de acesso (len={}, prefix={}...)",
                    normalizedAccessToken.length(),
                    maskPrefix(normalizedAccessToken));
        } else {
            log.warn("⚠️  MercadoPago: Token de acesso não configurado. Endpoints de pagamento não funcionarão.");
        }

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

    private String resolveAccessToken(String primaryToken, String normalizedPublicKey) {
        if (primaryToken.isBlank()) {
            return normalizeCredential(liveAccessTokenFallback);
        }

        boolean tokenIsTest = primaryToken.startsWith("TEST-");
        boolean keyIsLive = normalizedPublicKey.startsWith("APP_USR-");
        if (tokenIsTest && keyIsLive) {
            String fallback = normalizeCredential(liveAccessTokenFallback);
            if (!fallback.isBlank() && fallback.startsWith("APP_USR-")) {
                log.warn("MercadoPago: token TEST detectado com public key LIVE. Usando fallback LIVE token.");
                return fallback;
            }
        }

        return primaryToken;
    }

    private void validarCompatibilidadeCredenciais(String token, String key) {
        if (token.isBlank() || key.isBlank()) {
            return;
        }

        boolean tokenLive = token.startsWith("APP_USR-");
        boolean tokenTest = token.startsWith("TEST-");
        boolean keyLive = key.startsWith("APP_USR-");
        boolean keyTest = key.startsWith("TEST-");

        if ((tokenLive && keyTest) || (tokenTest && keyLive)) {
            log.error("MercadoPago inconsistente: access token e public key sao de ambientes diferentes (tokenPrefix={}, keyPrefix={}).",
                    maskPrefix(token),
                    maskPrefix(key));
        }
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getPublicKey() {
        return publicKey;
    }
}

