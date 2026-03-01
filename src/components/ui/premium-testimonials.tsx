import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  initials: string;
  rating: number;
  text: string;
  results: string[];
}

interface PremiumTestimonialsProps {
  testimonials?: Testimonial[];
}

const defaultTestimonials: Testimonial[] = [
  {
    name: "Ana Silva",
    role: "CEO, TechStart",
    company: "TechStart",
    initials: "AS",
    rating: 5,
    text: "A InoovaWeb revolucionou a forma como gerenciamos nossos projetos. A produtividade da equipe aumentou em 40% nos primeiros 3 meses.",
    results: ["40% mais produtividade", "Entrega 2x mais rápida", "ROI imediato"]
  },
  {
    name: "Carlos Mendes",
    role: "CTO, DataFlow",
    company: "DataFlow",
    initials: "CM",
    rating: 5,
    text: "O suporte é excepcional e a plataforma é incrivelmente intuitiva. Melhor investimento que fizemos para nossa infraestrutura digital.",
    results: ["Suporte 24/7", "Integração perfeita", "Zero downtime"]
  },
  {
    name: "Marina Costa",
    role: "Diretora de Produto, Appify",
    company: "Appify",
    initials: "MC",
    rating: 5,
    text: "Migramos toda nossa stack para a InoovaWeb e o resultado superou todas as expectativas. Performance e segurança de primeiro nível.",
    results: ["Performance 3x melhor", "Segurança avançada", "Migração suave"]
  },
  {
    name: "Rafael Torres",
    role: "Fundador, PixelLab",
    company: "PixelLab",
    initials: "RT",
    rating: 5,
    text: "Design incrível e ferramentas poderosas. Conseguimos lançar nosso MVP em metade do tempo previsto graças à plataforma.",
    results: ["MVP 50% mais rápido", "Design premium", "Escalável"]
  },
  {
    name: "Juliana Oliveira",
    role: "Head de Engenharia, CloudBR",
    company: "CloudBR",
    initials: "JO",
    rating: 5,
    text: "A escalabilidade da InoovaWeb é impressionante. Crescemos de 1.000 para 100.000 usuários sem nenhum problema.",
    results: ["100x escalabilidade", "Alta disponibilidade", "Custo otimizado"]
  }
];

export function PremiumTestimonials({ testimonials = defaultTestimonials }: PremiumTestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 600 : -600,
      opacity: 0,
      scale: 0.85,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 600 : -600,
      opacity: 0,
      scale: 0.85,
    })
  };

  const nextTestimonial = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section id="testimonials" className="relative px-5 sm:px-8 lg:px-16 py-16 sm:py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-xs font-medium text-purple-300">Histórias de Sucesso</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            A confiança de quem{' '}
            <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              já transforma
            </span>
          </h2>
          <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm sm:text-base">
            Empresas que aceleraram seus resultados com a InoovaWeb
          </p>
        </motion.div>

        {/* Testimonial Card */}
        <div className="relative min-h-[280px] sm:min-h-[200px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.23, 0.86, 0.39, 0.96] }}
              className="absolute inset-0"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6 h-full">
                {/* Mobile: stacked layout, Desktop: row */}
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 h-full">
                  {/* User Info */}
                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-sm font-bold text-purple-300">
                      {current.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm">{current.name}</p>
                      <p className="text-xs text-white/40">{current.role}</p>
                    </div>
                    <div className="flex gap-0.5 ml-auto sm:hidden shrink-0">
                      {[...Array(current.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-purple-400 text-purple-400" />
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="hidden sm:flex gap-0.5 mb-2">
                      {[...Array(current.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-purple-400 text-purple-400" />
                      ))}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed italic">
                      "{current.text}"
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {current.results.map((result, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-400/20"
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <motion.button
            onClick={prevTestimonial}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-purple-400 scale-125'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          <motion.button
            onClick={nextTestimonial}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
