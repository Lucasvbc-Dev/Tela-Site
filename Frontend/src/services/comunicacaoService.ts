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

interface ComunicacaoResponse {
  status?: string;
  message?: string;
}

const assertNoWarningStatus = (data: ComunicacaoResponse, fallbackMessage: string) => {
  if (data?.status === "accepted_with_warning") {
    throw new Error(data.message || fallbackMessage);
  }
};

export const comunicacaoService = {
  enviarContato: async (payload: ContatoPayload) => {
    try {
      const response = await api.post("/comunicacao/contato", payload);
      assertNoWarningStatus(response.data, "Erro ao enviar contato");
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao enviar contato";
      throw new Error(message);
    }
  },

  enviarConfirmacaoPedido: async (payload: ConfirmacaoPedidoPayload) => {
    try {
      const response = await api.post("/comunicacao/pedido-confirmacao", payload);
      assertNoWarningStatus(response.data, "Erro ao enviar confirmação do pedido");
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Erro ao enviar confirmação do pedido";
      throw new Error(message);
    }
  },
};