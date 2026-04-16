import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Clock3, XCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";

const CheckoutRetorno = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = (params.get("status") || params.get("payment_status") || "pending").toLowerCase();
  const pedidoId = params.get("external_reference") || params.get("pedidoId") || "";

  const isApproved = status === "approved" || status === "success";
  const isRejected = status === "rejected" || status === "cancelled" || status === "failure";

  const icon = isApproved ? CheckCircle : isRejected ? XCircle : Clock3;
  const title = isApproved
    ? "Pagamento confirmado"
    : isRejected
      ? "Pagamento não concluído"
      : "Pagamento em análise";
  const description = isApproved
    ? "Seu Checkout Pro foi aprovado. Você já pode acompanhar o pedido em Meus Pedidos e aguardar o envio do email de confirmação."
    : isRejected
      ? "O pagamento não foi aprovado. Você pode tentar novamente pelo catálogo ou voltar ao checkout."
      : "O pagamento foi recebido pelo Mercado Pago e aguarda confirmação. Assim que houver aprovação, seu pedido será atualizado.";

  return (
    <Layout>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 min-h-[80vh] flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-xl w-full mx-auto px-6 text-center"
        >
          {(() => {
            const Icon = icon;
            return <Icon size={64} className="mx-auto mb-6 text-foreground" />;
          })()}
          <h1 className="font-display text-4xl tracking-wide text-foreground mb-4">{title}</h1>
          <p className="font-body text-muted-foreground mb-6">{description}</p>
          {pedidoId && (
            <p className="font-body text-sm text-muted-foreground mb-8">
              Referência do pedido: <span className="text-foreground">{pedidoId}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/meus-pedidos"
              className="inline-block px-8 py-4 bg-foreground text-background font-body text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
            >
              Ver meus pedidos
            </Link>
            <Link
              to="/catalogo"
              className="inline-block px-8 py-4 border border-border text-foreground font-body text-sm tracking-wider uppercase hover:bg-secondary transition-colors"
            >
              Voltar ao catálogo
            </Link>
          </div>
        </motion.div>
      </section>
    </Layout>
  );
};

export default CheckoutRetorno;