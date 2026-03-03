import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pricing } from '@/components/ui/pricing';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Palette, Zap, Users, Star, Shield, Menu, X } from 'lucide-react';
import { PremiumTestimonials } from '@/components/ui/premium-testimonials';
import { Logos3 } from '@/components/ui/logos3';

// --- CSS AURORA BACKGROUND (no canvas = no click blocking) ---
const AuroraBackground: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(135deg, #0d0518 0%, #1a0a2e 30%, #160d30 60%, #0d0518 100%)',
      overflow: 'hidden',
    }}
  >
    {/* Orb 1 */}
    <div style={{
      position: 'absolute',
      top: '-20%',
      right: '-10%',
      width: '60vw',
      height: '60vw',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(120, 40, 200, 0.35) 0%, transparent 70%)',
      animation: 'orbFloat1 8s ease-in-out infinite',
      pointerEvents: 'none',
    }} />
    {/* Orb 2 */}
    <div style={{
      position: 'absolute',
      bottom: '-10%',
      left: '-10%',
      width: '50vw',
      height: '50vw',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(80, 20, 160, 0.30) 0%, transparent 70%)',
      animation: 'orbFloat2 10s ease-in-out infinite',
      pointerEvents: 'none',
    }} />
    {/* Orb 3 */}
    <div style={{
      position: 'absolute',
      top: '40%',
      left: '30%',
      width: '40vw',
      height: '40vw',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(170, 60, 220, 0.18) 0%, transparent 70%)',
      animation: 'orbFloat3 12s ease-in-out infinite',
      pointerEvents: 'none',
    }} />
    <style>{`
      @keyframes orbFloat1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-5%, 8%) scale(1.08); }
      }
      @keyframes orbFloat2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(6%, -6%) scale(1.05); }
      }
      @keyframes orbFloat3 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-4%, 5%) scale(1.1); }
      }
      @keyframes heroFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-18px); }
      }
    `}</style>
  </div>
);

// --- FEATURE CARD ---
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-white/60 leading-relaxed">{description}</p>
  </div>
);

// --- STAT BLOCK ---
const StatBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
    <p className="text-sm text-white/50 mt-1">{label}</p>
  </div>
);

// --- MAIN LANDING PAGE ---
const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* Pure CSS background – no canvas, no pointer blocking */}
      <AuroraBackground />

      {/* All content sits above background */}
      <div className="relative" style={{ zIndex: 1 }}>

        {/* ── NAV ── */}
        <header className="w-full px-4 sm:px-8 lg:px-16 py-5">
          <nav className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-sm text-white">
                IW
              </div>
              <span className="font-semibold text-white text-lg">InoovaWeb</span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Recursos</a>
              <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">Planos</a>
              <a href="#stats" className="text-sm text-white/70 hover:text-white transition-colors">Números</a>
              <a href="#cta" className="text-sm text-white/70 hover:text-white transition-colors">Contato</a>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 text-sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 text-sm">
                  Cadastre-se
                </Button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-white/80 hover:text-white"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 rounded-2xl border border-white/10 bg-purple-950/90 backdrop-blur-lg p-6 space-y-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70 hover:text-white py-2">Recursos</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70 hover:text-white py-2">Planos</a>
              <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70 hover:text-white py-2">Números</a>
              <a href="#cta" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/70 hover:text-white py-2">Contato</a>
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/10 text-sm">Entrar</Button>
                </Link>
                <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 text-sm">Cadastre-se</Button>
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* ── HERO ── */}
        <section className="px-4 sm:px-8 lg:px-16 pt-10 sm:pt-16 pb-16 sm:pb-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-8">

              {/* Left: text */}
              <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  Plataforma SaaS moderna
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
                  Crie experiências
                  <span className="block bg-gradient-to-r from-purple-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    digitais incríveis
                  </span>
                </h1>

                <p className="mt-6 text-base sm:text-lg text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Plataforma moderna para construir, gerenciar e escalar suas aplicações web com design elegante e performance excepcional.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
                  <Link to="/cadastro">
                    <Button size="lg" className="bg-white text-black hover:bg-white/90 font-semibold text-sm px-8 w-full sm:w-auto">
                      Começar agora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-medium text-sm px-8 w-full sm:w-auto bg-transparent">
                      Saiba mais
                    </Button>
                  </a>
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">500+</p>
                    <p className="text-xs text-white/40">Clientes</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">98%</p>
                    <p className="text-xs text-white/40">Satisfação</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">24/7</p>
                    <p className="text-xs text-white/40">Suporte</p>
                  </div>
                </div>
              </div>

              {/* Right: hero image */}
              <div className="flex-1 flex justify-center lg:justify-end order-1 lg:order-2 w-full max-w-xs sm:max-w-sm lg:max-w-none">
                <div className="relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px]">
                  {/* glow behind image */}
                  <div style={{
                    position: 'absolute',
                    inset: '-20px',
                    background: 'radial-gradient(ellipse at center, rgba(140,60,220,0.3) 0%, transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }} />
                  <img
                    src="https://i.postimg.cc/Gt6Pzv47/Gemini-Generated-Image-6zhwup6zhwup6zhw-Photoroom.png"
                    alt="InoovaWeb Assistant"
                    className="relative w-full h-auto object-contain drop-shadow-2xl"
                    style={{
                      animation: 'heroFloat 6s ease-in-out infinite',
                      maxHeight: '520px',
                      filter: 'drop-shadow(0 0 40px rgba(140, 60, 220, 0.4))',
                    }}
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── LOGO CAROUSEL ── */}
        <Logos3 />

        {/* ── FEATURES ── */}
        <section id="features" className="px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Por que nos escolher?</h2>
              <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm sm:text-base">
                Tudo o que você precisa para construir produtos digitais modernos
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <FeatureCard icon={<Code className="w-6 h-6" />} title="Código limpo" description="Arquitetura moderna com as melhores práticas de desenvolvimento web." />
              <FeatureCard icon={<Palette className="w-6 h-6" />} title="Design elegante" description="Interfaces bonitas e intuitivas que encantam seus usuários." />
              <FeatureCard icon={<Zap className="w-6 h-6" />} title="Alta performance" description="Aplicações rápidas e otimizadas para a melhor experiência." />
              <FeatureCard icon={<Shield className="w-6 h-6" />} title="Segurança" description="Proteção de dados com as mais recentes práticas de segurança." />
              <FeatureCard icon={<Users className="w-6 h-6" />} title="Colaboração" description="Trabalhe em equipe com ferramentas integradas de colaboração." />
              <FeatureCard icon={<Star className="w-6 h-6" />} title="Suporte dedicado" description="Equipe pronta para ajudar em cada etapa do seu projeto." />
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <div id="pricing">
          <Pricing plans={[
            {
              name: "INICIANTE",
              price: "49",
              yearlyPrice: "39",
              period: "por mês",
              features: ["Até 10 projetos", "Análises básicas", "Suporte em 48 horas", "Acesso limitado à API", "Suporte da comunidade"],
              description: "Perfeito para projetos individuais",
              buttonText: "Começar grátis",
              href: "/cadastro",
              isPopular: false,
            },
            {
              name: "PROFISSIONAL",
              price: "99",
              yearlyPrice: "79",
              period: "por mês",
              features: ["Projetos ilimitados", "Análises avançadas", "Suporte em 24 horas", "Acesso total à API", "Suporte prioritário", "Colaboração em equipe", "Integrações personalizadas"],
              description: "Ideal para equipes em crescimento",
              buttonText: "Escolher plano",
              href: "/cadastro",
              isPopular: true,
            },
            {
              name: "EMPRESARIAL",
              price: "299",
              yearlyPrice: "239",
              period: "por mês",
              features: ["Tudo do Profissional", "Soluções personalizadas", "Gerente de conta dedicado", "Suporte em 1 hora", "Autenticação SSO", "Segurança avançada", "Contratos personalizados", "Acordo de SLA"],
              description: "Para grandes organizações",
              buttonText: "Falar com vendas",
              href: "/cadastro",
              isPopular: false,
            },
          ]} />
        </div>

        {/* ── STATS ── */}
        <section id="stats" className="px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 sm:p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <StatBlock value="500+" label="Projetos entregues" />
                <StatBlock value="98%" label="Satisfação" />
                <StatBlock value="50+" label="Clientes ativos" />
                <StatBlock value="24/7" label="Suporte" />
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <PremiumTestimonials />

        {/* ── CTA ── */}
        <section id="cta" className="px-4 sm:px-8 lg:px-16 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Pronto para começar?</h2>
            <p className="text-white/50 mt-4 text-sm sm:text-base max-w-lg mx-auto">
              Junte-se a centenas de empresas que já confiam em nossa plataforma para crescer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/cadastro">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 font-semibold text-sm px-8 w-full sm:w-auto">
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-medium text-sm px-8 w-full sm:w-auto bg-transparent">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="px-4 sm:px-8 lg:px-16 py-8 border-t border-white/10">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">© 2026 InoovaWeb. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">Termos</a>
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">Privacidade</a>
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">Contato</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default LandingPage;
