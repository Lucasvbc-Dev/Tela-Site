import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, ShoppingBag, House, Circle, MenuSquare, Mail, Shield, LogIn, LogOut, UserCircle2, ReceiptText } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    void logout();
    navigate("/auth");
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { to: "/", label: "Início" },
    { to: "/catalogo", label: "Menu" },
    { to: "/sobre", label: "Sobre" },
    { to: "/contato", label: "Contato" },
  ];

  const mobileActions = [
    { to: "/", label: "Início", icon: House },
    { to: "/catalogo", label: "Menu", icon: MenuSquare },
    { to: "/sobre", label: "Sobre", icon: Circle },
    { to: "/contato", label: "Contato", icon: Mail },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo */}
            <Link to="/" className="relative z-10">
              <motion.span
                className="font-display text-3xl lg:text-4xl tracking-[0.3em] font-light text-foreground"
                whileHover={{ letterSpacing: "0.4em" }}
                transition={{ duration: 0.3 }}
              >
                TELA
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-10">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="elegant-link font-body text-sm tracking-widest uppercase text-foreground/80 hover:text-foreground transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}

              <div className="w-px h-5 bg-foreground/20" />

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-foreground/80 hover:text-foreground transition-colors duration-300 relative"
                aria-label="Sacola"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-[10px] font-body flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {!usuario ? (
                <Link
                  to="/auth"
                  className="p-2 text-foreground/80 hover:text-foreground transition-colors duration-300"
                  aria-label="Login"
                >
                  <User size={20} />
                </Link>
              ) : (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 text-foreground/80 hover:text-foreground transition-colors duration-300">
                    <User size={20} />
                    <span className="font-body text-sm tracking-wide">{usuario?.nome?.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-background border border-border rounded-lg shadow-lg py-2 min-w-[160px]">
                      <Link
                        to="/minha-conta"
                        className="block px-4 py-2 font-body text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Minha conta
                      </Link>
                      <Link
                        to="/meus-pedidos"
                        className="block px-4 py-2 font-body text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Meus pedidos
                      </Link>
                      {usuario?.isAdm && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 font-body text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                        >
                          Painel Admin
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 font-body text-sm text-destructive hover:bg-muted transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden relative z-10 p-2 text-foreground"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm lg:hidden overflow-y-auto"
          >
            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="min-h-screen flex flex-col justify-between px-6 py-6"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-display text-2xl tracking-[0.25em]">TELA</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-foreground"
                  aria-label="Fechar menu"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-3">
                {mobileActions.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 + index * 0.05 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl border border-border px-4 py-4 text-foreground bg-background/60"
                    >
                      <link.icon size={18} className="shrink-0" />
                      <span className="font-body text-base tracking-wide">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 space-y-4 border-t border-border pt-6">
                <button
                  onClick={() => {
                    setIsCartOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-4"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag size={18} />
                    <span className="font-body text-base">Sacola</span>
                  </span>
                  {totalItems > 0 && <span className="text-xs uppercase tracking-wider">{totalItems}</span>}
                </button>

                {!usuario ? (
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl bg-foreground px-4 py-4 text-background"
                  >
                    <LogIn size={18} />
                    <span className="font-body text-base">Entrar / Criar conta</span>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/minha-conta"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-4"
                    >
                      <UserCircle2 size={18} />
                      <span className="font-body text-base">Minha conta</span>
                    </Link>
                    <Link
                      to="/meus-pedidos"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-4"
                    >
                      <ReceiptText size={18} />
                      <span className="font-body text-base">Meus pedidos</span>
                    </Link>
                    {usuario?.isAdm && (
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-4"
                      >
                        <Shield size={18} />
                        <span className="font-body text-base">Painel Admin</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl border border-border px-4 py-4 text-destructive"
                    >
                      <LogOut size={18} />
                      <span className="font-body text-base">Sair</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
