import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { CreditCard, QrCode, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabaseStoreService } from "@/services/supabaseStoreService";
import { pagamentoService } from "@/services/pagamentoService";
import { comunicacaoService } from "@/services/comunicacaoService";
import { freteService, type FreteOpcao } from "@/services/freteService";

type PaymentMethod = "credito" | "debito" | "pix" | null;

type CardFormState = {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  securityCode: string;
  cpf: string;
  installments: number;
};

type OrderConfirmationState = {
  pedidoId: string;
  nomeCliente: string;
  emailCliente: string;
  total: number;
  subtotal: number;
  frete: number;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  metodoPagamento: Exclude<PaymentMethod, null>;
  dataPedido: string;
  freteSelecionado?: {
    transportadora: string;
    nome: string;
    prazoDias?: number;
  };
  itens: Array<{
    nome: string;
    quantidade: number;
    preco: number;
    imagem?: string;
    tamanho?: string;
  }>;
};

type ViaCepResponse = {
  logradouro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

const CHECKOUT_PENDING_ORDER_KEY = "checkout_pending_order";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const toMonth = (value: string) => onlyDigits(value).slice(0, 2);
const toYear = (value: string) => onlyDigits(value).slice(0, 2);

const mapMercadoPagoStatusToLocal = (status?: string): "PAGO" | "PENDENTE" | "CANCELADO" => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "approved") {
    return "PAGO";
  }
  if (normalized === "cancelled" || normalized === "rejected" || normalized === "refunded") {
    return "CANCELADO";
  }
  return "PENDENTE";
};

const normalizeImageSrc = (src?: string) => {
  const value = (src || "").trim();
  if (!value) {
    return "";
  }

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return `/${value.replace(/^\.?\//, "")}`;
};

const buildImageFallback = (itemName: string) => {
  const label = (itemName || "TELA").slice(0, 14).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='420'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='%23e5e7eb'/><stop offset='100%' stop-color='%23cbd5e1'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23334155' font-family='Arial, sans-serif' font-size='22' letter-spacing='1'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

const Checkout = () => {
  const { items, clearCart } = useCart();
  const { toast } = useToast();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState<CardFormState>({
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    securityCode: "",
    cpf: "",
    installments: 1,
  });
  const [currentPedidoId, setCurrentPedidoId] = useState<string | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  const [rua, setRua] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [isBuscandoCep, setIsBuscandoCep] = useState(false);
  const [frete, setFrete] = useState(0);
  const [freteOpcoes, setFreteOpcoes] = useState<FreteOpcao[]>([]);
  const [freteSelecionadoId, setFreteSelecionadoId] = useState("");
  const [isCalculandoFrete, setIsCalculandoFrete] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationState | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [confirmationAttempted, setConfirmationAttempted] = useState(false);

  const isDevelopment = import.meta.env.DEV;
  const isHttps = window.location.protocol === "https:";
  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const allowCardOnHttpLocal = import.meta.env.VITE_ALLOW_CARD_ON_HTTP_LOCAL === "true";
  const isSecureCardContext = isHttps || (isDevelopment && isLocalHost && allowCardOnHttpLocal);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalComFrete = totalPrice + frete;
  const isPixSelected = paymentMethod === "pix";
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

  const buscarEnderecoPorCep = async (rawCep: string) => {
    const cepLimpo = rawCep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      return;
    }

    try {
      setIsBuscandoCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      if (!response.ok) {
        throw new Error("Nao foi possivel consultar o CEP informado.");
      }

      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) {
        throw new Error("CEP nao encontrado.");
      }

      setRua((data.logradouro || "").trim());
      setCidade((data.localidade || "").trim());
      setEstado((data.uf || "").trim().toUpperCase());
    } catch (error: any) {
      toast({
        title: "Erro ao buscar CEP",
        description: error?.message || "Nao foi possivel buscar o endereco pelo CEP.",
        variant: "destructive",
      });
    } finally {
      setIsBuscandoCep(false);
    }
  };

  const handleCalcularFrete = async () => {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Informe um CEP com 8 dígitos para calcular o frete.",
        variant: "destructive",
      });
      return;
    }

    if (!items.length) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens antes de calcular o frete.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCalculandoFrete(true);
      const response = await freteService.calcularFrete({
        cepDestino: cepLimpo,
        cidadeDestino: cidade.trim(),
        estadoDestino: estado.trim(),
        itens: items.map((item) => ({
          nome: item.name,
          quantidade: item.quantity,
          preco: Number(item.price.toFixed(2)),
        })),
      });

      const opcoesValidas = response.opcoes.filter((opcao) => !opcao.erro && typeof opcao.valor === "number");
      setFreteOpcoes(response.opcoes);

      if (!opcoesValidas.length) {
        setFrete(0);
        setFreteSelecionadoId("");
        toast({
          title: "Sem opções de frete",
          description: "Não encontramos opções válidas para esse CEP.",
          variant: "destructive",
        });
        return;
      }

      const opcaoMaisBarata = [...opcoesValidas].sort((a, b) => a.valor - b.valor)[0];
      setFreteSelecionadoId(opcaoMaisBarata.id);
      setFrete(opcaoMaisBarata.valor);

      toast({
        title: "Frete calculado",
        description: `${opcoesValidas.length} opção(ões) encontrada(s) para o CEP informado.`,
      });
    } catch (error: any) {
      setFreteOpcoes([]);
      setFreteSelecionadoId("");
      setFrete(0);
      toast({
        title: "Erro ao calcular frete",
        description: error?.message || "Não foi possível calcular o frete no momento.",
        variant: "destructive",
      });
    } finally {
      setIsCalculandoFrete(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast({ title: "Selecione uma forma de pagamento", variant: "destructive" });
      return;
    }

    if (!usuario) {
      toast({
        title: "Faça login para continuar",
        description: "Você precisa estar autenticado para finalizar o pedido.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!rua.trim() || !complemento.trim() || !cep.trim() || !cidade.trim() || !estado.trim()) {
      toast({
        title: "Endereço incompleto",
        description: "Preencha rua, numero/complemento, CEP, cidade e estado para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!freteSelecionadoId) {
      toast({
        title: "Calcule o frete",
        description: "Calcule e selecione uma opção de frete para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "pix" && totalComFrete < 0.01) {
      toast({
        title: "Valor mínimo para PIX",
        description: "Para pagamento via PIX, o valor do pedido deve ser de pelo menos R$ 0,01.",
        variant: "destructive",
      });
      return;
    }

    if ((paymentMethod === "credito" || paymentMethod === "debito") && isSecureCardContext) {
      const number = onlyDigits(cardForm.cardNumber);
      const cvv = onlyDigits(cardForm.securityCode);
      const cpf = onlyDigits(cardForm.cpf);
      const month = toMonth(cardForm.expiryMonth);
      const year = toYear(cardForm.expiryYear);

      if (!cardForm.cardholderName.trim() || number.length < 13 || cvv.length < 3 || cpf.length < 11 || month.length < 2 || year.length < 2) {
        toast({
          title: "Dados do cartão incompletos",
          description: "Preencha nome, número, validade, CVV e CPF para continuar.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const enderecoCompleto = `${rua.trim()}, ${complemento.trim()}`;

      const itensPayload = items.map((item) => ({
        produtoId: item.id,
        nome: item.name,
        preco: item.price,
        quantidade: item.quantity,
        tamanhoProduto: item.size,
      }));

      const pedido = await supabaseStoreService.criarPedido({
        usuarioId: usuario.id,
        metodoPagamento: paymentMethod,
        itens: itensPayload,
        endereco: enderecoCompleto,
        cep,
        cidade,
        estado,
        frete,
      });
      setCurrentPedidoId(pedido.id);
      const freteSelecionado = freteOpcoes.find((opcao) => opcao.id === freteSelecionadoId);
      const confirmationPayload: OrderConfirmationState = {
        pedidoId: pedido.id,
        nomeCliente: usuario.nome,
        emailCliente: usuario.email,
        total: Number(totalComFrete.toFixed(2)),
        subtotal: Number(totalPrice.toFixed(2)),
        frete: Number(frete.toFixed(2)),
        endereco: `${enderecoCompleto}, ${cidade} - ${estado}, CEP ${cep}`,
        cep,
        cidade,
        estado,
        metodoPagamento: paymentMethod,
        dataPedido: new Date().toISOString(),
        freteSelecionado: freteSelecionado
          ? {
              transportadora: freteSelecionado.transportadora,
              nome: freteSelecionado.nome,
              prazoDias: freteSelecionado.prazoDias,
            }
          : undefined,
        itens: items.map((item) => ({
          nome: item.name,
          quantidade: item.quantity,
          preco: item.price,
          imagem: normalizeImageSrc(item.image),
          tamanho: item.size,
        })),
      };
      setOrderConfirmation(confirmationPayload);
      setConfirmationSent(false);
      setConfirmationAttempted(false);

      if (paymentMethod === "pix") {
        const pixResponse = await pagamentoService.pagarComPix({
          pedidoId: pedido.id,
          valor: Number(totalComFrete.toFixed(2)),
          metodo: "PIX",
          email: usuario.email,
        });

        let txData = pixResponse.point_of_interaction?.transaction_data;
        
        // Se não houver QR Code na resposta inicial, tenta consultar novamente após 2 segundos
        if (!txData?.qr_code && !txData?.qr_code_base64) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const statusResponse = await pagamentoService.consultarStatusPagamento(String(pixResponse.id));
            // Se a resposta tiver os dados do QR Code, use-os
            if (statusResponse && statusResponse.point_of_interaction?.transaction_data) {
              txData = statusResponse.point_of_interaction.transaction_data;
            }
          } catch (e) {
            // Se falhar ao consultar, continua com o que tem
            console.warn("Não foi possível consultar QR Code após criação", e);
          }
        }

        if (!txData?.qr_code && !txData?.qr_code_base64) {
          throw new Error("PIX criado sem QR Code. Sua conta no Mercado Pago pode não estar habilitada para gerar QR Codes via API. Tente usar o Checkout Pro ou valide sua configuração no painel do Mercado Pago.");
        }

        const pixStatusLocal = mapMercadoPagoStatusToLocal(pixResponse.status);
        await supabaseStoreService.atualizarStatusPedidoEPagamento({
          pedidoId: pedido.id,
          status: pixStatusLocal,
          transactionId: String(pixResponse.id),
        });

        setPixQrBase64(txData.qr_code_base64 || null);
        setPixCode(txData.qr_code || null);
        setPixPaymentId(String(pixResponse.id));
        clearCart();

        if (pixStatusLocal === "PAGO") {
          setOrderPlaced(true);
        }
        return;
      }

      if (!isSecureCardContext) {
        localStorage.setItem(CHECKOUT_PENDING_ORDER_KEY, JSON.stringify(confirmationPayload));

        const checkout = await pagamentoService.criarCheckoutPro({
          pedidoId: pedido.id,
          email: usuario.email,
          metodoPagamento: paymentMethod,
          itens: items.map((item) => ({
            produtoId: item.id,
            nome: item.name,
            preco: Number(item.price.toFixed(2)),
            quantidade: item.quantity,
          })),
          backUrl: `${window.location.origin}/checkout/retorno`,
        });

        const checkoutUrl = checkout.initPoint || checkout.sandboxInitPoint;
        if (!checkoutUrl) {
          throw new Error("Nao foi possivel iniciar o checkout seguro do Mercado Pago.");
        }

        window.location.href = checkoutUrl;
        return;
      }

      const cardToken = await pagamentoService.criarTokenCartao({
        cardholderName: cardForm.cardholderName.trim(),
        cardNumber: onlyDigits(cardForm.cardNumber),
        cardExpirationMonth: toMonth(cardForm.expiryMonth),
        cardExpirationYear: toYear(cardForm.expiryYear),
        securityCode: onlyDigits(cardForm.securityCode),
        identificationType: "CPF",
        identificationNumber: onlyDigits(cardForm.cpf),
      });

      const cardPayment = await pagamentoService.pagarComCartao({
        pedidoId: pedido.id,
        valor: Number(totalComFrete.toFixed(2)),
        email: usuario.email,
        token: cardToken,
        installments: paymentMethod === "debito" ? 1 : Math.min(Math.max(cardForm.installments, 1), 3),
      });

      const cardStatusLocal = mapMercadoPagoStatusToLocal(cardPayment.status);
      await supabaseStoreService.atualizarStatusPedidoEPagamento({
        pedidoId: pedido.id,
        status: cardStatusLocal,
        transactionId: String(cardPayment.id),
      });

      clearCart();
      setOrderPlaced(cardStatusLocal === "PAGO");

      if (cardStatusLocal !== "PAGO") {
        toast({
          title: "Pagamento em análise",
          description: "Seu pedido foi criado e o pagamento está pendente. Você pode acompanhar em Meus Pedidos.",
        });
        navigate("/meus-pedidos");
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Erro desconhecido";

      console.error("Erro ao criar pedido:", error);

      toast({
        title: "Erro ao finalizar pedido",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!pixPaymentId || !currentPedidoId || orderPlaced) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const response = await pagamentoService.consultarStatusPagamento(pixPaymentId);
        const statusLocal = mapMercadoPagoStatusToLocal(response.status);

        await supabaseStoreService.atualizarStatusPedidoEPagamento({
          pedidoId: currentPedidoId,
          status: statusLocal,
          transactionId: pixPaymentId,
        });

        if (statusLocal === "PAGO") {
          setOrderPlaced(true);
          setPixCode(null);
          setPixQrBase64(null);
          window.clearInterval(timer);
        }

        if (statusLocal === "CANCELADO") {
          window.clearInterval(timer);
        }
      } catch {
        // Mantém polling silencioso para tentar novamente.
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [pixPaymentId, currentPedidoId, orderPlaced]);

  useEffect(() => {
    if (!orderPlaced || !orderConfirmation || confirmationSent || confirmationAttempted) {
      return;
    }

    const enviarConfirmacao = async () => {
      setConfirmationAttempted(true);
      try {
        await comunicacaoService.enviarConfirmacaoPedido(orderConfirmation);
        setConfirmationSent(true);
      } catch (error) {
        console.error("Erro ao enviar confirmação do pedido:", error);
        toast({
          title: "Pedido confirmado, mas sem e-mail",
          description: "Nao conseguimos enviar a confirmacao por e-mail agora. Nossa equipe ja recebeu seu pedido.",
          variant: "destructive",
        });
      }
    };

    void enviarConfirmacao();
  }, [orderPlaced, orderConfirmation, confirmationSent, confirmationAttempted, toast]);

  const handleCopiarPix = async () => {
    if (!pixCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(pixCode);
      toast({ title: "Codigo PIX copiado" });
    } catch {
      toast({
        title: "Nao foi possivel copiar",
        description: "Copie manualmente o codigo PIX exibido.",
        variant: "destructive",
      });
    }
  };

  if (orderPlaced) {
    const metodoPagamentoLabel: Record<Exclude<PaymentMethod, null>, string> = {
      credito: "Cartao de Credito",
      debito: "Cartao de Debito",
      pix: "PIX",
    };

    const dataPedidoFormatada = orderConfirmation
      ? new Date(orderConfirmation.dataPedido).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <Layout>
        <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 bg-background min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto px-6 lg:px-10"
          >
            <div className="rounded-xl border border-border bg-secondary/20 p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle size={30} className="text-foreground" />
                    <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground">
                      Pagamento confirmado
                    </p>
                  </div>
                  <h1 className="font-display text-3xl lg:text-4xl tracking-wide text-foreground mb-2">Pedido confirmado com sucesso</h1>
                  <p className="font-body text-sm text-muted-foreground">
                    Obrigado pela compra, {orderConfirmation?.nomeCliente}. Enviamos os detalhes para {orderConfirmation?.emailCliente}.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background px-4 py-3 min-w-[220px]">
                  <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Numero do pedido</p>
                  <p className="font-display text-lg text-foreground break-all">#{orderConfirmation?.pedidoId}</p>
                  <p className="font-body text-xs text-muted-foreground mt-2">{dataPedidoFormatada}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 rounded-xl border border-border bg-background p-5 md:p-6">
                <h2 className="font-display text-2xl tracking-wide text-foreground mb-5">Itens do pedido</h2>
                <div className="space-y-4">
                  {orderConfirmation?.itens.map((item, index) => (
                    <div key={`${item.nome}-${index}`} className="flex gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
                      <div className="w-20 h-24 bg-secondary overflow-hidden rounded-md flex-shrink-0">
                        {item.imagem ? (
                          <img
                            src={normalizeImageSrc(item.imagem)}
                            alt={item.nome}
                            className="w-full h-full object-cover"
                            onError={(event) => {
                              event.currentTarget.src = buildImageFallback(item.nome);
                            }}
                          />
                        ) : (
                          <img src={buildImageFallback(item.nome)} alt={item.nome} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-lg text-foreground leading-tight">{item.nome}</p>
                        <p className="font-body text-xs text-muted-foreground mt-1">Quantidade: {item.quantidade}</p>
                        {item.tamanho && (
                          <p className="font-body text-xs text-muted-foreground">Tamanho: {item.tamanho}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground">Valor unitario</p>
                        <p className="font-body text-sm text-foreground">{formatPrice(item.preco)}</p>
                        <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mt-2">Subtotal item</p>
                        <p className="font-display text-lg text-foreground">{formatPrice(item.preco * item.quantidade)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-background p-5">
                  <h3 className="font-display text-xl tracking-wide text-foreground mb-4">Entrega</h3>
                  <p className="font-body text-sm text-foreground leading-relaxed mb-2">{orderConfirmation?.endereco}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {orderConfirmation?.cidade} - {orderConfirmation?.estado} | CEP {orderConfirmation?.cep}
                  </p>
                  {orderConfirmation?.freteSelecionado && (
                    <div className="mt-4 rounded-md border border-border bg-secondary/20 p-3">
                      <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Frete selecionado</p>
                      <p className="font-body text-sm text-foreground">
                        {orderConfirmation.freteSelecionado.transportadora} - {orderConfirmation.freteSelecionado.nome}
                      </p>
                      {typeof orderConfirmation.freteSelecionado.prazoDias === "number" && (
                        <p className="font-body text-xs text-muted-foreground mt-1">
                          Prazo estimado: {orderConfirmation.freteSelecionado.prazoDias} dia(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-background p-5">
                  <h3 className="font-display text-xl tracking-wide text-foreground mb-4">Pagamento</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">Metodo</span>
                    <span className="font-body text-sm text-foreground">
                      {orderConfirmation ? metodoPagamentoLabel[orderConfirmation.metodoPagamento] : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">Subtotal</span>
                    <span className="font-body text-sm text-foreground">{formatPrice(orderConfirmation?.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">Frete</span>
                    <span className="font-body text-sm text-foreground">{formatPrice(orderConfirmation?.frete || 0)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-body text-xs uppercase tracking-wider text-muted-foreground">Total pago</span>
                    <span className="font-display text-2xl text-foreground">{formatPrice(orderConfirmation?.total || 0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="/meus-pedidos"
                    className="inline-flex justify-center items-center px-4 py-3 border border-foreground text-foreground font-body text-xs tracking-wider uppercase hover:bg-secondary transition-colors"
                  >
                    Ver meus pedidos
                  </a>
                  <a
                    href="/catalogo"
                    className="inline-flex justify-center items-center px-4 py-3 bg-foreground text-background font-body text-xs tracking-wider uppercase hover:bg-foreground/90 transition-colors"
                  >
                    Continuar comprando
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </Layout>
    );
  }

  if (pixQrBase64 || pixCode) {
    return (
      <Layout>
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full mx-auto px-6 text-center"
          >
            <h1 className="font-display text-4xl tracking-wide text-foreground mb-4">Pagamento PIX</h1>
            <p className="font-body text-muted-foreground mb-8">
              Escaneie o QR Code no app do banco ou copie o código abaixo para concluir o pagamento.
            </p>

            {pixQrBase64 && (
              <div className="bg-white p-4 rounded-md inline-block mb-6 shadow-sm">
                <img
                  src={`data:image/png;base64,${pixQrBase64}`}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              </div>
            )}

            {pixCode && (
              <div className="space-y-4 text-left max-w-lg mx-auto">
                <div className="rounded-md border border-border bg-secondary/30 p-4">
                  <p className="font-body text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
                    Pix copia e cola
                  </p>
                  <textarea
                    value={pixCode}
                    readOnly
                    className="w-full h-32 p-3 border border-border bg-background text-xs font-mono"
                  />
                </div>
                <p className="font-body text-xs text-muted-foreground text-center">
                  Chave cadastrada na loja: tela.contato123@gmail.com
                </p>
                <button
                  onClick={handleCopiarPix}
                  className="w-full px-6 py-3 bg-foreground text-background font-body text-xs tracking-wider uppercase"
                >
                  Copiar código Pix copia e cola
                </button>
              </div>
            )}
          </motion.div>
        </section>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 min-h-[80vh] flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="font-display text-4xl tracking-wide text-foreground mb-4">Sacola Vazia</h1>
            <p className="font-body text-muted-foreground mb-8">Adicione produtos ao seu carrinho antes de finalizar.</p>
            <a
              href="/catalogo"
              className="inline-block px-8 py-4 bg-foreground text-background font-body text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
            >
              Ver Menu
            </a>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="display-heading text-foreground mb-12 text-center"
          >
            Checkout
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Order Summary */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="font-display text-2xl tracking-wide text-foreground mb-6 pb-4 border-b border-border">
                Resumo do Pedido
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-20 bg-secondary overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-base text-foreground">{item.name}</h3>
                      <p className="font-body text-xs text-muted-foreground">Tamanho: {item.size}</p>
                      <p className="font-body text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-body text-sm text-foreground self-center">{formatPrice(item.price)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <span className="font-body text-sm tracking-wider uppercase text-muted-foreground">Subtotal</span>
                <span className="font-display text-2xl text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="font-body text-sm tracking-wider uppercase text-muted-foreground">Frete</span>
                <span className="font-display text-2xl text-foreground">{formatPrice(frete)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="font-body text-sm tracking-wider uppercase text-muted-foreground">Total</span>
                <span className="font-display text-3xl text-foreground">{formatPrice(totalComFrete)}</span>
              </div>
            </motion.div>

            {/* Delivery & Payment */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="font-display text-2xl tracking-wide text-foreground mb-6 pb-4 border-b border-border">
                Endereço de Entrega
              </h2>
              <div className="space-y-3 mb-8">
                <input
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  placeholder="Rua"
                  className="w-full h-11 px-3 border border-border bg-background font-body text-sm"
                />
                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Numero, apartamento, bloco, referencia..."
                  className="w-full h-11 px-3 border border-border bg-background font-body text-sm"
                />
                <input
                  value={cep}
                  onChange={(e) => {
                    const novoCep = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setCep(novoCep);
                    setFrete(0);
                    setFreteOpcoes([]);
                    setFreteSelecionadoId("");
                    if (novoCep.length < 8) {
                      setRua("");
                      setCidade("");
                      setEstado("");
                    }
                  }}
                  onBlur={() => {
                    void buscarEnderecoPorCep(cep);
                  }}
                  placeholder="CEP (00000-000)"
                  className="w-full h-11 px-3 border border-border bg-background font-body text-sm"
                />
                {isBuscandoCep && (
                  <p className="font-body text-xs text-muted-foreground">Buscando endereço pelo CEP...</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                    className="h-11 px-3 border border-border bg-background font-body text-sm"
                  />
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="h-11 px-3 border border-border bg-background font-body text-sm"
                  >
                    <option value="">UF</option>
                    <option value="SP">SP</option>
                    <option value="RJ">RJ</option>
                    <option value="MG">MG</option>
                    <option value="RS">RS</option>
                    <option value="BA">BA</option>
                    <option value="SC">SC</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="CE">CE</option>
                    <option value="PA">PA</option>
                    <option value="GO">GO</option>
                    <option value="PB">PB</option>
                    <option value="MA">MA</option>
                    <option value="ES">ES</option>
                    <option value="PI">PI</option>
                    <option value="RN">RN</option>
                    <option value="AL">AL</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="DF">DF</option>
                    <option value="AC">AC</option>
                    <option value="AM">AM</option>
                    <option value="AP">AP</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
                <button
                  onClick={handleCalcularFrete}
                  disabled={isCalculandoFrete}
                  type="button"
                  className="w-full h-11 px-4 border border-border bg-secondary/30 font-body text-xs tracking-wider uppercase hover:bg-secondary/50 transition-colors disabled:opacity-60"
                >
                  {isCalculandoFrete ? "Calculando frete..." : "Calcular frete com Melhor Envio"}
                </button>

                {freteOpcoes.length > 0 && (
                  <select
                    value={freteSelecionadoId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setFreteSelecionadoId(selectedId);
                      const opcao = freteOpcoes.find((item) => item.id === selectedId);
                      if (opcao && !opcao.erro && typeof opcao.valor === "number") {
                        setFrete(opcao.valor);
                      }
                    }}
                    className="w-full h-11 px-3 border border-border bg-background font-body text-sm"
                  >
                    <option value="">Selecione a opção de frete</option>
                    {freteOpcoes.map((opcao) => (
                      <option key={opcao.id} value={opcao.id} disabled={Boolean(opcao.erro)}>
                        {opcao.transportadora} - {opcao.nome}
                        {opcao.erro
                          ? ` (indisponível: ${opcao.erro})`
                          : ` (${formatPrice(opcao.valor)}${opcao.prazoDias ? ` | ${opcao.prazoDias} dia(s)` : ""})`}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex justify-between items-center rounded-md border border-border bg-secondary/20 p-3">
                  <span className="font-body text-xs tracking-wider uppercase text-muted-foreground">Frete selecionado</span>
                  <span className="font-display text-lg text-foreground">{formatPrice(frete)}</span>
                </div>
              </div>

              <h2 className="font-display text-2xl tracking-wide text-foreground mb-6 pb-4 border-b border-border">
                Forma de Pagamento
              </h2>
              <div className="space-y-3">
                {[
                  { id: "credito" as const, label: "Cartão de Crédito", icon: CreditCard, desc: "Até 3x sem juros" },
                  { id: "debito" as const, label: "Cartão de Débito", icon: CreditCard, desc: "Pagamento à vista" },
                  { id: "pix" as const, label: "PIX", icon: QrCode, desc: "QR Code e Pix copia e cola" },
                ].map((method) => (
                  <motion.button
                    key={method.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 text-left ${
                      paymentMethod === method.id
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <method.icon size={24} className="text-foreground flex-shrink-0" />
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{method.label}</p>
                      <p className="font-body text-xs text-muted-foreground">{method.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>

              {isPixSelected && (
                <div className="mt-4 rounded-md border border-border bg-secondary/40 p-4">
                  <p className="font-body text-sm text-foreground mb-1">Ao finalizar, mostraremos o QR Code e o Pix copia e cola nesta mesma tela.</p>
                  <p className="font-body text-xs text-muted-foreground">Chave da loja cadastrada no Mercado Pago: tela.contato123@gmail.com</p>
                </div>
              )}

              {(paymentMethod === "credito" || paymentMethod === "debito") && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  {!isSecureCardContext && (
                    <div className="rounded-md border border-border bg-secondary/30 p-4">
                      <p className="font-body text-sm text-foreground mb-1">
                        Caso a rede nao esteja segura, voce sera direcionado para o Mercado Pago.
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        Em rede segura, o pagamento por cartao acontece aqui no site.
                      </p>
                    </div>
                  )}
                  <input
                    value={cardForm.cardholderName}
                    onChange={(event) => setCardForm((prev) => ({ ...prev, cardholderName: event.target.value }))}
                    placeholder="Nome impresso no cartão"
                    disabled={!isSecureCardContext}
                    className="w-full h-11 px-3 border border-border bg-background font-body text-sm"
                  />
                  <input
                    value={cardForm.cardNumber}
                    onChange={(event) =>
                      setCardForm((prev) => ({
                        ...prev,
                        cardNumber: onlyDigits(event.target.value).slice(0, 16),
                      }))
                    }
                    placeholder="Número do cartão"
                    inputMode="numeric"
                    disabled={!isSecureCardContext}
                    className="w-full h-11 px-3 border border-border bg-background font-body text-sm"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      value={cardForm.expiryMonth}
                      onChange={(event) => setCardForm((prev) => ({ ...prev, expiryMonth: toMonth(event.target.value) }))}
                      placeholder="MM"
                      inputMode="numeric"
                      disabled={!isSecureCardContext}
                      className="h-11 px-3 border border-border bg-background font-body text-sm"
                    />
                    <input
                      value={cardForm.expiryYear}
                      onChange={(event) => setCardForm((prev) => ({ ...prev, expiryYear: toYear(event.target.value) }))}
                      placeholder="AA"
                      inputMode="numeric"
                      disabled={!isSecureCardContext}
                      className="h-11 px-3 border border-border bg-background font-body text-sm"
                    />
                    <input
                      value={cardForm.securityCode}
                      onChange={(event) =>
                        setCardForm((prev) => ({
                          ...prev,
                          securityCode: onlyDigits(event.target.value).slice(0, 4),
                        }))
                      }
                      placeholder="CVV"
                      inputMode="numeric"
                      disabled={!isSecureCardContext}
                      className="h-11 px-3 border border-border bg-background font-body text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={cardForm.cpf}
                      onChange={(event) =>
                        setCardForm((prev) => ({
                          ...prev,
                          cpf: onlyDigits(event.target.value).slice(0, 11),
                        }))
                      }
                      placeholder="CPF do titular"
                      inputMode="numeric"
                      disabled={!isSecureCardContext}
                      className="h-11 px-3 border border-border bg-background font-body text-sm"
                    />
                    <select
                      value={cardForm.installments}
                      onChange={(event) =>
                        setCardForm((prev) => ({
                          ...prev,
                          installments: Math.min(Math.max(Number(event.target.value), 1), 3),
                        }))
                      }
                      disabled={paymentMethod === "debito" || !isSecureCardContext}
                      className="h-11 px-3 border border-border bg-background font-body text-sm"
                    >
                      {Array.from({ length: 3 }, (_, index) => index + 1).map((parcelas) => (
                        <option key={parcelas} value={parcelas}>
                          {parcelas}x
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 border border-border bg-secondary/30"
              >
                <div className="flex items-start gap-3">
                  <QrCode size={20} className="mt-0.5 text-foreground shrink-0" />
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    O pagamento é concluído aqui no site. Para PIX, o QR Code é gerado imediatamente após confirmar.
                  </p>
                </div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full mt-8 py-4 bg-foreground text-background font-body text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
              >
                {isSubmitting
                  ? "Processando..."
                  : paymentMethod === "pix"
                    ? "Gerar QR Code PIX"
                    : (paymentMethod === "credito" || paymentMethod === "debito") && !isSecureCardContext
                      ? "Ir para pagamento seguro Mercado Pago"
                    : paymentMethod
                      ? "Pagar no site"
                      : "Confirmar Pedido"}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
