package backendtela.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import backendtela.dto.FreteCalculoItemDTO;
import backendtela.dto.FreteCalculoRequestDTO;
import backendtela.dto.FreteCalculoResponseDTO;
import backendtela.dto.FreteOpcaoResponseDTO;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FreteService {

    private final RestClient restClient;

    @Value("${melhorenvio.base-url:https://www.melhorenvio.com.br}")
    private String melhorEnvioBaseUrl;

    @Value("${melhorenvio.token:}")
    private String melhorEnvioToken;

    @Value("${melhorenvio.origin-cep:60000-000}")
    private String origemCep;

    @Value("${melhorenvio.default-width-cm:20}")
    private Integer defaultLarguraCm;

    @Value("${melhorenvio.default-height-cm:4}")
    private Integer defaultAlturaCm;

    @Value("${melhorenvio.default-length-cm:28}")
    private Integer defaultComprimentoCm;

    @Value("${melhorenvio.default-weight-kg:0.3}")
    private BigDecimal defaultPesoKg;

    public FreteService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public FreteCalculoResponseDTO calcularFrete(FreteCalculoRequestDTO request) {
        String cepDestino = limparCep(request.getCepDestino());
        if (cepDestino.length() != 8) {
            throw new IllegalArgumentException("CEP de destino invalido. Informe 8 digitos.");
        }

        if (melhorEnvioToken == null || melhorEnvioToken.isBlank()) {
            log.warn("MELHORENVIO_TOKEN nao configurado. Retornando simulacao de frete para ambiente de desenvolvimento.");
            return calcularFreteSimulado(cepDestino);
        }

        validarConfiguracao();

        String cepOrigem = limparCep(origemCep);
        if (cepOrigem.length() != 8) {
            throw new IllegalStateException("CEP de origem do Melhor Envio invalido. Revise MELHORENVIO_ORIGIN_CEP.");
        }

        Map<String, Object> payload = montarPayload(cepOrigem, cepDestino, request.getItens());

        try {
            List<Map<String, Object>> response = restClient.post()
                    .uri(melhorEnvioBaseUrl + "/api/v2/me/shipment/calculate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + melhorEnvioToken.trim())
                    .header("User-Agent", "Tela-Ecommerce/1.0")
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {
                    });

            if (response == null || response.isEmpty()) {
                throw new IllegalStateException("Nenhuma opcao de frete retornada pelo Melhor Envio.");
            }

            List<FreteOpcaoResponseDTO> opcoes = mapearOpcoes(response);
            if (opcoes.isEmpty()) {
                throw new IllegalStateException("Nao foi possivel gerar opcoes de frete com os dados informados.");
            }

            return new FreteCalculoResponseDTO(cepDestino, opcoes);
        } catch (RestClientResponseException e) {
            log.error("Erro ao consultar Melhor Envio: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new IllegalStateException("Falha ao consultar o Melhor Envio. Verifique token, CEPs e dados dos produtos.");
        } catch (RuntimeException e) {
            log.error("Erro inesperado ao calcular frete no Melhor Envio", e);
            throw new IllegalStateException("Nao foi possivel calcular o frete no momento.");
        }
    }

    private Map<String, Object> montarPayload(String cepOrigem, String cepDestino, List<FreteCalculoItemDTO> itens) {
        List<Map<String, Object>> products = new ArrayList<>();

        for (int i = 0; i < itens.size(); i++) {
            FreteCalculoItemDTO item = itens.get(i);

            Integer largura = Optional.ofNullable(item.getLarguraCm()).orElse(defaultLarguraCm);
            Integer altura = Optional.ofNullable(item.getAlturaCm()).orElse(defaultAlturaCm);
            Integer comprimento = Optional.ofNullable(item.getComprimentoCm()).orElse(defaultComprimentoCm);
            BigDecimal peso = Optional.ofNullable(item.getPesoKg()).orElse(defaultPesoKg);

            Map<String, Object> product = new HashMap<>();
            product.put("id", String.valueOf(i + 1));
            product.put("description", item.getNome());
            product.put("width", largura);
            product.put("height", altura);
            product.put("length", comprimento);
            product.put("weight", peso);
            product.put("insurance_value", item.getPreco());
            product.put("quantity", item.getQuantidade());
            products.add(product);
        }

        Map<String, Object> from = Map.of("postal_code", cepOrigem);
        Map<String, Object> to = Map.of("postal_code", cepDestino);

        Map<String, Object> options = new HashMap<>();
        options.put("receipt", false);
        options.put("own_hand", false);

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", from);
        payload.put("to", to);
        payload.put("products", products);
        payload.put("options", options);

        return payload;
    }

    private List<FreteOpcaoResponseDTO> mapearOpcoes(List<Map<String, Object>> response) {
        List<FreteOpcaoResponseDTO> opcoes = new ArrayList<>();

        for (Map<String, Object> item : response) {
            String erro = toText(item.get("error"));
            String id = toText(item.get("id"));
            String nome = toText(item.get("name"));
            Integer prazo = toInteger(item.get("delivery_time"));
            BigDecimal valor = toBigDecimal(item.get("price"));
            String moeda = Optional.ofNullable(toText(item.get("currency"))).orElse("BRL");

            String transportadora = "Melhor Envio";
            Object companyObj = item.get("company");
            if (companyObj instanceof Map<?, ?> companyMap) {
                String companyName = toText(companyMap.get("name"));
                if (companyName != null && !companyName.isBlank()) {
                    transportadora = companyName;
                }
            }

            opcoes.add(new FreteOpcaoResponseDTO(id, nome, transportadora, valor, prazo, moeda, erro));
        }

        opcoes.sort(Comparator.comparing(
                opcao -> opcao.getValor() == null ? BigDecimal.valueOf(Double.MAX_VALUE) : opcao.getValor()));

        return opcoes;
    }

    private void validarConfiguracao() {
        if (melhorEnvioBaseUrl == null || melhorEnvioBaseUrl.isBlank()) {
            throw new IllegalStateException("MELHORENVIO_BASE_URL nao configurado.");
        }
    }

    private FreteCalculoResponseDTO calcularFreteSimulado(String cepDestino) {
        List<FreteOpcaoResponseDTO> opcoes = new ArrayList<>();
        opcoes.add(new FreteOpcaoResponseDTO(
                "sim-1",
                "PAC",
                "Correios (Simulado)",
                new BigDecimal("19.90"),
                7,
                "BRL",
                null));
        opcoes.add(new FreteOpcaoResponseDTO(
                "sim-2",
                "SEDEX",
                "Correios (Simulado)",
                new BigDecimal("29.90"),
                3,
                "BRL",
                null));
        return new FreteCalculoResponseDTO(cepDestino, opcoes);
    }

    private String limparCep(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    private String toText(Object value) {
        if (value == null) {
            return null;
        }
        return String.valueOf(value).trim();
    }

    private Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return new BigDecimal(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
