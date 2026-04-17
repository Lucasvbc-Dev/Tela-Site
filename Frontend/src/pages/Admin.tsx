import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import AnimatedSection from "@/components/ui/AnimatedSection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, RefreshCw, Package, RotateCcw } from "lucide-react";
import { supabaseStoreService } from "@/services/supabaseStoreService";
import { pagamentoService } from "@/services/pagamentoService";
import { useToast } from "@/hooks/use-toast";

/* =========================
   🔹 NOVO: types alinhados com o backend
   ========================= */
type ItemPedido = {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagemUrl?: string;
};

type Pedido = {
  id: string;
  nome: string;
  email: string;
  endereco: string;
  itens: ItemPedido[];
  total: number;
  status: string;
  transactionId?: string;
  paymentStatus?: string;
  createdAt: string;
};

const Admin = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     🔹 Proteção da rota admin
     ========================= */
  useEffect(() => {
    if (!usuario || !usuario.isAdm) {
      navigate("/");
    }
  }, [usuario, navigate]);

  /* =========================
     🔹 ALTERADO: endpoint admin
     ========================= */
  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const data = await supabaseStoreService.listarPedidosAdmin();
      setPedidos(data);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (pedidoId: string, status: string) => {
    try {
      await supabaseStoreService.atualizarStatusPedido(pedidoId, status);
      fetchPedidos(); // 🔹 recarrega lista
    } catch (error) {
      console.error("Erro ao atualizar status", error);
    }
  };

  const reembolsarPedido = async (pedido: Pedido) => {
    if (!pedido.transactionId) {
      toast({
        title: "Pagamento sem transação",
        description: "Não foi encontrado um ID de pagamento para este pedido.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm(`Reembolsar o pedido ${pedido.id}?`)) {
      return;
    }

    try {
      await pagamentoService.reembolsarPagamento(pedido.transactionId);
      await supabaseStoreService.atualizarStatusPedidoEPagamento({
        pedidoId: pedido.id,
        status: "CANCELADO",
        transactionId: pedido.transactionId,
      });
      toast({
        title: "Reembolso solicitado",
        description: "O pagamento foi processado e o pedido foi cancelado.",
      });
      fetchPedidos();
    } catch (error: any) {
      toast({
        title: "Falha ao reembolsar",
        description: error?.message || "Não foi possível reembolsar este pedido.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (usuario?.isAdm) {
      fetchPedidos();
      const interval = setInterval(fetchPedidos, 30000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  if (!usuario?.isAdm) return null;

  return (
    <Layout>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-background">
        <div className="container mx-auto px-6 lg:px-12">

          <AnimatedSection>
            <div className="flex items-center justify-center gap-3 mb-4">
              <ShieldCheck size={28} />
              <h1 className="display-heading text-center">
                Painel Admin
              </h1>
            </div>
            <p className="text-lg text-muted-foreground text-center max-w-xl mx-auto mb-12">
              Acompanhe todas as compras realizadas.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Package size={18} />
                <span className="text-sm uppercase">
                  {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchPedidos}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 border"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Atualizar
              </motion.button>
            </div>

            <div className="border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Total</TableHead>

                    {/* 🔹 NOVO */}
                    <TableHead>Status</TableHead>

                    <TableHead>Endereço</TableHead>
                        <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading && pedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        Carregando pedidos...
                      </TableCell>
                    </TableRow>
                  ) : pedidos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16">
                        Nenhum pedido registrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pedidos.map((pedido) => (
                      <TableRow key={pedido.id}>

                        {/* 🔹 createdAt do backend */}
                        <TableCell>
                          {new Date(pedido.createdAt).toLocaleString()}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p>{pedido.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {pedido.email}
                            </p>
                          </div>
                        </TableCell>

                        {/* 🔹 ALTERADO: render correto dos itens */}
                        <TableCell>
                          <div className="space-y-3">
                            {pedido.itens.map((item, index) => (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                                  {item.imagemUrl ? (
                                    <img
                                      src={item.imagemUrl}
                                      alt={item.nome}
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-[10px] uppercase text-muted-foreground">
                                      Sem foto
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">
                                    {item.quantidade}x {item.nome}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell>
                          R$ {pedido.total.toFixed(2)}
                        </TableCell>

                        {/* 🔹 NOVO: status vindo do backend */}
                        <TableCell className="uppercase text-xs">
                          {pedido.status}
                        </TableCell>

                        <TableCell>
                          {pedido.endereco}
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col gap-3">
                            <select
                              value={pedido.status}
                              onChange={(e) => {
                                atualizarStatus(pedido.id, e.target.value);
                              }}
                              className="border px-2 py-1 text-xs uppercase"
                            >
                              <option value="PENDENTE">Pendente</option>
                              <option value="ENVIADO">Enviado</option>
                              <option value="ENTREGUE">Entregue</option>
                              <option value="CANCELADO">Cancelado</option>
                            </select>

                            {(pedido.paymentStatus || pedido.status) === "PAGO" && pedido.transactionId && (
                              <button
                                type="button"
                                onClick={() => void reembolsarPedido(pedido)}
                                className="inline-flex items-center justify-center gap-2 border px-3 py-2 text-xs uppercase tracking-wider"
                              >
                                <RotateCcw size={14} />
                                Reembolsar
                              </button>
                            )}
                          </div>
                        </TableCell>


                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;