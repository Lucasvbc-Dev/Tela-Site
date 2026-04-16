import api from "./api";

export interface ContatoPayload {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
}

export interface ConfirmacaoPedidoPayload {
  pedidoId: string;
  nomeCliente: string;
  emailCliente: string;
  total: number;
  endereco?: string;
  itens: Array<{
    nome: string;
    quantidade: number;
    preco: number;
  }>;
}

export const comunicacaoService = {
  enviarContato: async (payload: ContatoPayload) => {
    try {
      const response = await api.post("/comunicacao/contato", payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao enviar contato";
      throw new Error(message);
    }
  },

  enviarConfirmacaoPedido: async (payload: ConfirmacaoPedidoPayload) => {
    try {
      const response = await api.post("/comunicacao/pedido-confirmacao", payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao enviar confirmação do pedido";
      throw new Error(message);
    }
  },
};