import api from "./api";

export interface FreteItemPayload {
  nome: string;
  quantidade: number;
  preco: number;
  pesoKg?: number;
  larguraCm?: number;
  alturaCm?: number;
  comprimentoCm?: number;
}

export interface CalcularFretePayload {
  cepDestino: string;
  itens: FreteItemPayload[];
}

export interface FreteOpcao {
  id: string;
  nome: string;
  transportadora: string;
  valor: number;
  prazoDias: number | null;
  moeda: string;
  erro?: string | null;
}

export interface CalcularFreteResponse {
  cepDestino: string;
  opcoes: FreteOpcao[];
}

export const freteService = {
  async calcularFrete(payload: CalcularFretePayload): Promise<CalcularFreteResponse> {
    try {
      const response = await api.post("/fretes/calcular", payload);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Nao foi possivel calcular o frete";
      throw new Error(message);
    }
  },
};
