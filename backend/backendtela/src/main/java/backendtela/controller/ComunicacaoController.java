package backendtela.controller;

import backendtela.dto.ConfirmacaoPedidoEmailDTO;
import backendtela.dto.ContatoMensagemDTO;
import backendtela.service.EmailService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;
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
            return ResponseEntity.accepted()
                    .body(Map.of(
                            "status", "accepted_with_warning",
                            "message", "Mensagem recebida com sucesso. Estamos com instabilidade temporaria no envio de email e retornaremos em breve."
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
        }
    }
}