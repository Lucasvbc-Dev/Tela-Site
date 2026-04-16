package backendtela.service;

import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mercadopago.resources.payment.Payment;

import backendtela.dto.CriarPagamentoDTO;
import backendtela.dto.CriarPreferenciaPagamentoDTO;
import backendtela.dto.PagamentoCartaoDTO;
import backendtela.dto.PreferenciaPagamentoResponseDTO;
import backendtela.entidades.Pagamentos;
import backendtela.enums.Metodo;
import backendtela.enums.Status;
import backendtela.repository.PagamentoRepository;
import backendtela.repository.PedidoRepository;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class PagamentoService {

    private final MercadoPagoService mercadoPagoService;
    private final PagamentoRepository pagamentoRepository;
    private final PedidoRepository pedidoRepository;
    private final WebhookService webhookService;

    public PagamentoService(
            MercadoPagoService mercadoPagoService,
            PagamentoRepository pagamentoRepository,
            PedidoRepository pedidoRepository,
            WebhookService webhookService
    ) {
        this.mercadoPagoService = mercadoPagoService;
        this.pagamentoRepository = pagamentoRepository;
        this.pedidoRepository = pedidoRepository;
        this.webhookService = webhookService;
    }

    /**
     * Processar pagamento via PIX.
     */
    public Payment pagarPix(CriarPagamentoDTO dto) throws Exception {
        Payment payment = mercadoPagoService.criarPagamentoPix(dto);
        salvarRegistroPagamento(dto.getPedidoId(), dto.getValor(), Metodo.PIX, payment);
        return payment;
    }

    /**
     * Processar pagamento via Cartão de Crédito.
     */
    public Payment pagarCartao(PagamentoCartaoDTO dto) throws Exception {
        Payment payment = mercadoPagoService.criarPagamentoCartao(dto);
        salvarRegistroPagamento(dto.getPedidoId(), dto.getValor(), Metodo.CARTAO_DE_CREDITO, payment);
        return payment;
    }

    public Payment consultarPagamento(String paymentId) throws Exception {
        return mercadoPagoService.buscarPagamento(paymentId);
    }

    /**
     * Criar preferência do Checkout Pro para redirecionar o cliente ao Mercado Pago.
     */
    public PreferenciaPagamentoResponseDTO criarPreferenciaCheckoutPro(CriarPreferenciaPagamentoDTO dto) {
        return mercadoPagoService.criarPreferenciaCheckoutPro(dto);
    }

    /**
     * Processar webhook do MercadoPago.
     * Delegado para o serviço de webhook que consulta o pagamento no Mercado Pago
     * e atualiza pagamento/pedido.
     */
    public void processarWebhook(String payload, String signature) throws Exception {
        webhookService.processarWebhook(payload, signature);
    }

    /**
     * Reembolsar pagamento pelo Mercado Pago e atualizar os registros locais.
     */
    public void reembolsarPagamento(String paymentId) {
        Pagamentos pagamento = pagamentoRepository.findByTransactionId(paymentId)
                .orElseThrow(() -> new IllegalStateException("Pagamento não encontrado para reembolso"));

        mercadoPagoService.reembolsarPagamento(paymentId);

        pagamentoRepository.updateStatusAndTransaction(
                pagamento.getIdPagamento(),
                paymentId,
                Status.CANCELADO.name()
        );
        pedidoRepository.updateStatus(pagamento.getPedidoId(), "CANCELADO");
        log.info("Pagamento reembolsado: paymentId={}, pedidoId={}", paymentId, pagamento.getPedidoId());
    }

    /**
     * Salvar registro de pagamento no banco de dados.
     */
    private void salvarRegistroPagamento(String pedidoId, java.math.BigDecimal valor, Metodo metodo, Payment payment) {
        Pagamentos registro = new Pagamentos();
        registro.setIdPagamento(UUID.randomUUID().toString());
        registro.setPedidoId(pedidoId);
        registro.setValor(valor);
        registro.setMetodo(metodo);
        registro.setTransactionId(payment.getId() == null ? null : String.valueOf(payment.getId()));
        registro.setStatus(mapStatus(payment.getStatus()));

        pagamentoRepository.save(registro);
        log.info("Pagamento registrado: ID={}, Status={}", registro.getIdPagamento(), registro.getStatus());
    }

    /**
     * Mapear status do MercadoPago para Status local.
     */
    private Status mapStatus(String mpStatus) {
        if (mpStatus == null) {
            return Status.PENDENTE;
        }

        String normalized = mpStatus.toLowerCase(Locale.ROOT);
        if ("approved".equals(normalized)) {
            return Status.PAGO;
        }
        if ("cancelled".equals(normalized) || "rejected".equals(normalized)) {
            return Status.CANCELADO;
        }
        return Status.PENDENTE;
    }
}

