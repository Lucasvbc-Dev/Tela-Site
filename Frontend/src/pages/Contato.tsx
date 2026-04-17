import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { MapPin, Phone, Mail, Clock, Instagram, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { comunicacaoService } from "@/services/comunicacaoService";


const Contato = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors = {
      name: "",
      email: "",
      subject: "",
      message: "",
    };

    if (!formData.name.trim()) {
      errors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.email.trim()) {
      errors.email = "E-mail é obrigatório";
    } else if (!validateEmail(formData.email)) {
      errors.email = "E-mail inválido";
    }

    if (!formData.subject) {
      errors.subject = "Assunto é obrigatório";
    }

    if (!formData.message.trim()) {
      errors.message = "Mensagem é obrigatória";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Mensagem deve ter pelo menos 10 caracteres";
    }

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== "");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpar erro ao usuário começar a digitar
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, corrija os erros abaixo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      await comunicacaoService.enviarContato({
        nome: formData.name.trim(),
        email: formData.email.trim(),
        assunto: formData.subject,
        mensagem: formData.message.trim(),
      });
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setFormErrors({ name: "", email: "", subject: "", message: "" });
      toast({ 
        title: "Mensagem enviada!", 
        description: "Sua mensagem foi encaminhada para a loja. Responderemos em breve!" 
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error?.message || "Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Telefone",
      details: ["(85) 8989-1444"],
    },
    {
      icon: Mail,
      title: "E-mail",
      details: ["tela.contato123@gmail.com"],
    },
    {
      icon: Instagram,
      title: "Instagram",
      details: ["@telatshirt"],
    },
  
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="display-heading text-foreground mb-6">Contato</h1>
            <p className="font-body text-lg text-muted-foreground">
              Estamos aqui para ajudar. Entre em contato conosco.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Contact Info */}
            <AnimatedSection>
              <div>
                <h2 className="font-display text-2xl lg:text-3xl text-foreground mb-8">
                  Informações de Contato
                </h2>

                <div className="space-y-8">
                  {contactInfo.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex gap-4"
                    >
                      <div className="w-12 h-12 border border-border flex items-center justify-center flex-shrink-0">
                        <item.icon size={20} className="text-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg text-foreground mb-1">
                          {item.title}
                        </h3>
                        {item.details.map((detail, i) => (
                          <p
                            key={i}
                            className="font-body text-sm text-muted-foreground"
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Social */}
              </div>
            </AnimatedSection>

           {/* Contact Form */} 
           
            <AnimatedSection delay={0.2}>
              <div className="bg-secondary p-8 lg:p-12">
                <h2 className="font-display text-2xl lg:text-3xl text-foreground mb-8">
                  Envie uma Mensagem
                </h2>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-6 border border-foreground flex items-center justify-center">
                      <Send size={24} className="text-foreground" />
                    </div>
                    <h3 className="font-display text-2xl text-foreground mb-4">
                      Mensagem Enviada!
                    </h3>
                    <p className="font-body text-muted-foreground">
                      Obrigada pelo contato. Responderemos em breve.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block font-body text-xs tracking-wider uppercase text-muted-foreground mb-2">
                        Nome
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-background border font-body text-sm focus:outline-none transition-colors duration-300 ${
                          formErrors.name 
                            ? "border-red-500 focus:border-red-600" 
                            : "border-border focus:border-foreground"
                        }`}
                        placeholder="Seu nome completo"
                      />
                      {formErrors.name && (
                        <p className="text-red-500 font-body text-xs mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-body text-xs tracking-wider uppercase text-muted-foreground mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-background border font-body text-sm focus:outline-none transition-colors duration-300 ${
                          formErrors.email 
                            ? "border-red-500 focus:border-red-600" 
                            : "border-border focus:border-foreground"
                        }`}
                        placeholder="seu@email.com"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 font-body text-xs mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-body text-xs tracking-wider uppercase text-muted-foreground mb-2">
                        Assunto
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-background border font-body text-sm focus:outline-none transition-colors duration-300 ${
                          formErrors.subject 
                            ? "border-red-500 focus:border-red-600" 
                            : "border-border focus:border-foreground"
                        }`}
                      >
                        <option value="">Selecione um assunto</option>
                        <option value="Dúvidas sobre Produtos">Dúvidas sobre Produtos</option>
                        <option value="Pedidos e Entregas">Pedidos e Entregas</option>
                        <option value="Reclamações e Sugestões">Reclamações e Sugestões</option>
                        <option value="Parcerias">Parcerias</option>
                        <option value="Outros">Outros</option>
                      </select>
                      {formErrors.subject && (
                        <p className="text-red-500 font-body text-xs mt-1">{formErrors.subject}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-body text-xs tracking-wider uppercase text-muted-foreground mb-2">
                        Mensagem
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className={`w-full px-4 py-3 bg-background border font-body text-sm focus:outline-none transition-colors duration-300 resize-none ${
                          formErrors.message 
                            ? "border-red-500 focus:border-red-600" 
                            : "border-border focus:border-foreground"
                        }`}
                        placeholder="Digite sua mensagem aqui... (mínimo 10 caracteres)"
                      />
                      <div className="flex justify-between items-center mt-1">
                        {formErrors.message && (
                          <p className="text-red-500 font-body text-xs">{formErrors.message}</p>
                        )}
                        <p className="text-muted-foreground font-body text-xs ml-auto">
                          {formData.message.length}/500
                        </p>
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSending}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-8 py-4 bg-foreground text-background font-body text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <span className="inline-block animate-spin">⏳</span>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Enviar Mensagem
                        </>
                      )}
                    </motion.button>
                  </form>
                )}
              </div> 
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;
