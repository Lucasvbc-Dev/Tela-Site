package backendtela.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FreteCalculoResponseDTO {
    private String cepDestino;
    private List<FreteOpcaoResponseDTO> opcoes;
}
