package backendtela.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreteCalculoItemDTO {

    @NotBlank(message = "Nome do item e obrigatorio")
    private String nome;

    @NotNull(message = "Quantidade do item e obrigatoria")
    @Min(value = 1, message = "Quantidade minima e 1")
    private Integer quantidade;

    @NotNull(message = "Preco do item e obrigatorio")
    @DecimalMin(value = "0.01", message = "Preco deve ser maior que zero")
    private BigDecimal preco;

    // Campos opcionais para sobrescrever valores padrao da embalagem no Melhor Envio.
    private BigDecimal pesoKg;
    private Integer larguraCm;
    private Integer alturaCm;
    private Integer comprimentoCm;
}
