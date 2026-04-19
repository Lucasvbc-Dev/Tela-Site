package backendtela.controller;

import backendtela.dto.ConfirmacaoPedidoEmailDTO;
import backendtela.dto.ContatoMensagemDTO;
import backendtela.service.EmailService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/comunicacao")
@CrossOrigin
public class ComunicacaoController {

    private final EmailService emailService;

    public ComunicacaoController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/contato")
    public ResponseEntity<?> enviarContato(@Valid @RequestBody ContatoMensagemDTO dto) {
        try {
            emailService.enviarContato(dto);
            return ResponseEntity.accepted().build();
        } catch (IllegalStateException e) {
            log.error("Falha ao enviar email de contato", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "status", "email_delivery_failed",
                            "message", "Nao foi possivel enviar sua mensagem agora por instabilidade no servico de e-mail. Tente novamente em alguns minutos."
                    ));
        } catch (Exception e) {
            log.error("Erro inesperado no contato", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "status", "contact_request_failed",
                    "message", "Nao foi possivel processar sua mensagem agora. Tente novamente mais tarde."
                ));
        }
    }

    @PostMapping("/pedido-confirmacao")
    public ResponseEntity<?> enviarConfirmacaoPedido(@Valid @RequestBody ConfirmacaoPedidoEmailDTO dto) {
        try {
            emailService.enviarConfirmacaoPedido(dto);
            return ResponseEntity.accepted().build();
        } catch (IllegalStateException e) {
            log.error("Falha ao enviar email de confirmacao do pedido {}", dto.getPedidoId(), e);
            return ResponseEntity.accepted()
                    .body(Map.of(
                            "status", "accepted_with_warning",
                            "message", "Pedido confirmado. O email de confirmacao sera reenviado automaticamente."
                    ));
        } catch (Exception e) {
            log.error("Erro inesperado no envio de confirmacao do pedido {}", dto.getPedidoId(), e);
            return ResponseEntity.accepted()
                    .body(Map.of(
                            "status", "accepted_with_warning",
                            "message", "Pedido confirmado. O email de confirmacao sera reenviado automaticamente."
                    ));
        }
    }
}