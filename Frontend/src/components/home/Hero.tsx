import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import heroImage from "@/assets/capa.png";

const Hero = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <motion.div
        initial={reduceMotion ? false : { scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute inset-0"
      >
        <img
          src={heroImage}
          alt="TELA Fashion"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-background/10" />
      </motion.div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-6 lg:px-12 flex flex-col justify-end pb-24 lg:pb-32">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.2 : 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-2xl"
        >
          <h1 className="display-heading text-[3.5rem] md:text-[4.2rem] lg:text-[4.6rem] text-foreground mb-6 leading-none">
            Menos Excesso
            <br />
            Mais Essência
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="font-body text-lg lg:text-xl text-foreground/70 mb-8 max-w-md"
          >
            Descubra nossa coleção exclusiva de blusas femininas, onde cada peça
            conta uma história de sofisticação.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <Link
              to="/catalogo"
              className="inline-block group"
            >
              <span className="font-body text-sm tracking-[0.2em] uppercase text-foreground border-b-2 border-foreground pb-2 transition-all duration-300 group-hover:pb-3">
                Explorar Coleção
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-16 bg-foreground/30"
        />
      </motion.div>
    </section>
  );
};

export default Hero;
