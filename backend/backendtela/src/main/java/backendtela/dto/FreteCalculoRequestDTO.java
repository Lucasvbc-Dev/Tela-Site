package backendtela.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreteCalculoRequestDTO {

    @NotBlank(message = "CEP de destino e obrigatorio")
    private String cepDestino;

    private String cidadeDestino;

    private String estadoDestino;

    @Valid
    @NotEmpty(message = "Pelo menos um item e obrigatorio para calcular o frete")
    private List<FreteCalculoItemDTO> itens;
}
