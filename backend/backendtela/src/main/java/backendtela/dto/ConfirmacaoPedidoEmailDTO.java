package backendtela.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public class ConfirmacaoPedidoEmailDTO {

    @NotBlank(message = "ID do pedido é obrigatório")
    private String pedidoId;

    @NotBlank(message = "Nome do cliente é obrigatório")
    private String nomeCliente;

    @NotBlank(message = "E-mail do cliente é obrigatório")
    @Email(message = "E-mail do cliente inválido")
    private String emailCliente;

    @NotNull(message = "Total do pedido é obrigatório")
    private BigDecimal total;

    @NotEmpty(message = "É necessário informar ao menos um item")
    @Valid
    private List<ItemPedidoEmailDTO> itens;

    private String endereco;

    public String getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(String pedidoId) {
        this.pedidoId = pedidoId;
    }

    public String getNomeCliente() {
        return nomeCliente;
    }

    public void setNomeCliente(String nomeCliente) {
        this.nomeCliente = nomeCliente;
    }

    public String getEmailCliente() {
        return emailCliente;
    }

    public void setEmailCliente(String emailCliente) {
        this.emailCliente = emailCliente;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public List<ItemPedidoEmailDTO> getItens() {
        return itens;
    }

    public void setItens(List<ItemPedidoEmailDTO> itens) {
        this.itens = itens;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }
}