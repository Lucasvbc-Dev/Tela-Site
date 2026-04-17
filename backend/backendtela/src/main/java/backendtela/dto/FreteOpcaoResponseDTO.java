package backendtela.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreteOpcaoResponseDTO {
    private String id;
    private String nome;
    private String transportadora;
    private BigDecimal valor;
    private Integer prazoDias;
    private String moeda;
    private String erro;
}
