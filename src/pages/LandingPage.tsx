import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Pricing } from '@/components/ui/pricing';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Palette, Zap, Users, Star, Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ANIMATION HELPERS ---
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

// --- ANIMATED AURORA BACKGROUND ---
const AuroraBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    // Three.js setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.display = 'block';
    currentMount.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;

        float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 ip = floor(p); vec2 u = fract(p);
          u = u * u * (3.0 - 2.0 * u);
          float res = mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
                          mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
          return res * res;
        }
        float fbm(vec2 x) {
          float v = 0.0; float a = 0.3;
          vec2 shift = vec2(100);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < 3; ++i) {
            v += a * noise(x); x = rot * x * 2.0 + shift; a *= 0.5;
          }
          return v;
        }
        void main() {
          vec2 uv = gl_FragCoord.xy / iResolution.xy;
          float t = iTime * 0.1;
          vec3 color1 = vec3(0.1, 0.05, 0.2);
          vec3 color2 = vec3(0.25, 0.1, 0.45);
          vec3 color3 = vec3(0.4, 0.15, 0.7);
          vec3 color4 = vec3(0.15, 0.05, 0.35);
          float n1 = fbm(uv * 3.0 + t);
          float n2 = fbm(uv * 2.0 - t * 0.5 + vec2(5.0));
          float n3 = fbm(uv * 4.0 + t * 0.3 + vec2(10.0));
          vec3 col = mix(color1, color2, n1);
          col = mix(col, color3, n2 * 0.4);
          col = mix(col, color4, n3 * 0.3);
          float glow = fbm(uv * 1.5 + t * 0.2) * 0.15;
          col += vec3(0.3, 0.1, 0.5) * glow;
          float vig = 1.0 - length((uv - 0.5) * 1.2);
          col *= smoothstep(0.0, 0.7, vig);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      material.uniforms.iTime.value += 0.016;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (currentMount.contains(renderer.domElement)) currentMount.removeChild(renderer.domElement);
      renderer.dispose();
      material.dispose();
      geometry.dispose();
    };
  }, []);

  return <div ref={mountRef} />;
};

// --- FEATURE CARD ---
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <motion.div
    variants={fadeUp}
    className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
  >
    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary-foreground">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-white/60 leading-relaxed">{description}</p>
  </motion.div>
);

// --- STAT ---
const StatBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <motion.div variants={fadeUp} className="text-center">
    <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
    <p className="text-sm text-white/50 mt-1">{label}</p>
  </motion.div>
);

// --- MAIN LANDING PAGE ---
const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Recursos", href: "#features" },
    { label: "Planos", href: "#pricing" },
    { label: "Números", href: "#stats" },
    { label: "Contato", href: "#cta" },
  ];

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <AuroraBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Nav */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full px-5 sm:px-8 lg:px-16 py-5"
        >
          <nav className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-sm text-white">
                IW
              </div>
              <span className="font-semibold text-white text-lg">InoovaWeb</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <a key={link.href} href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">{link.label}</a>
              ))}
            </div>

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
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden overflow-hidden"
              >
                <div className="max-w-6xl mx-auto pt-4 pb-6 flex flex-col gap-3">
                  {navLinks.map(link => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm text-white/70 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/10">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/10 text-sm justify-start">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 text-sm">
                        Cadastre-se
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Hero */}
        <section className="px-5 sm:px-8 lg:px-16 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight"
              >
                Crie experiências
                <span className="block bg-gradient-to-r from-purple-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  digitais incríveis
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6 text-base sm:text-lg text-white/60 max-w-xl leading-relaxed"
              >
                Plataforma moderna para construir, gerenciar e escalar suas aplicações web com design elegante e performance excepcional.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mt-8"
              >
                <Link to="/cadastro">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90 font-medium text-sm px-8 w-full sm:w-auto">
                    Começar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-medium text-sm px-8 w-full sm:w-auto bg-transparent">
                    Saiba mais
                  </Button>
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Por que nos escolher?</h2>
              <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm sm:text-base">
                Tudo o que você precisa para construir produtos digitais modernos
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              <FeatureCard icon={<Code className="w-6 h-6" />} title="Código limpo" description="Arquitetura moderna com as melhores práticas de desenvolvimento web." />
              <FeatureCard icon={<Palette className="w-6 h-6" />} title="Design elegante" description="Interfaces bonitas e intuitivas que encantam seus usuários." />
              <FeatureCard icon={<Zap className="w-6 h-6" />} title="Alta performance" description="Aplicações rápidas e otimizadas para a melhor experiência." />
              <FeatureCard icon={<Shield className="w-6 h-6" />} title="Segurança" description="Proteção de dados com as mais recentes práticas de segurança." />
              <FeatureCard icon={<Users className="w-6 h-6" />} title="Colaboração" description="Trabalhe em equipe com ferramentas integradas de colaboração." />
              <FeatureCard icon={<Star className="w-6 h-6" />} title="Suporte dedicado" description="Equipe pronta para ajudar em cada etapa do seu projeto." />
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <Pricing plans={[
          { name: "INICIANTE", price: "49", yearlyPrice: "39", period: "por mês", features: ["Até 10 projetos", "Análises básicas", "Suporte em 48 horas", "Acesso limitado à API", "Suporte da comunidade"], description: "Perfeito para projetos individuais", buttonText: "Começar grátis", href: "/cadastro", isPopular: false },
          { name: "PROFISSIONAL", price: "99", yearlyPrice: "79", period: "por mês", features: ["Projetos ilimitados", "Análises avançadas", "Suporte em 24 horas", "Acesso total à API", "Suporte prioritário", "Colaboração em equipe", "Integrações personalizadas"], description: "Ideal para equipes em crescimento", buttonText: "Escolher plano", href: "/cadastro", isPopular: true },
          { name: "EMPRESARIAL", price: "299", yearlyPrice: "239", period: "por mês", features: ["Tudo do Profissional", "Soluções personalizadas", "Gerente de conta dedicado", "Suporte em 1 hora", "Autenticação SSO", "Segurança avançada", "Contratos personalizados", "Acordo de SLA"], description: "Para grandes organizações", buttonText: "Falar com vendas", href: "/cadastro", isPopular: false },
        ]} />

        {/* Stats */}
        <section id="stats" className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={scaleIn}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 sm:p-12"
            >
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid grid-cols-2 md:grid-cols-4 gap-8"
              >
                <StatBlock value="500+" label="Projetos entregues" />
                <StatBlock value="98%" label="Satisfação" />
                <StatBlock value="50+" label="Clientes ativos" />
                <StatBlock value="24/7" label="Suporte" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-white">O que nossos clientes dizem</h2>
              <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm sm:text-base">
                Empresas que transformaram seus negócios com a InoovaWeb
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {[
                { name: "Ana Silva", role: "CEO, TechStart", quote: "A InoovaWeb revolucionou a forma como gerenciamos nossos projetos. A produtividade da equipe aumentou em 40% nos primeiros 3 meses.", initials: "AS" },
                { name: "Carlos Mendes", role: "CTO, DataFlow", quote: "O suporte é excepcional e a plataforma é incrivelmente intuitiva. Melhor investimento que fizemos para nossa infraestrutura digital.", initials: "CM" },
                { name: "Marina Costa", role: "Diretora de Produto, Appify", quote: "Migramos toda nossa stack para a InoovaWeb e o resultado superou todas as expectativas. Performance e segurança de primeiro nível.", initials: "MC" },
                { name: "Rafael Torres", role: "Fundador, PixelLab", quote: "Design incrível e ferramentas poderosas. Conseguimos lançar nosso MVP em metade do tempo previsto graças à plataforma.", initials: "RT" },
                { name: "Juliana Oliveira", role: "Head de Engenharia, CloudBR", quote: "A escalabilidade da InoovaWeb é impressionante. Crescemos de 1.000 para 100.000 usuários sem nenhum problema.", initials: "JO" },
                { name: "Pedro Almeida", role: "Gerente de Projetos, NovaTech", quote: "A colaboração em equipe ficou muito mais fluida. Todos os nossos times agora trabalham integrados em um único lugar.", initials: "PA" },
              ].map((t, index) => (
                <motion.div
                  key={index}
                  variants={fadeUp}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-sm font-semibold text-purple-300">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed flex-1">"{t.quote}"</p>
                  <div className="flex gap-0.5 mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <motion.section
          id="cta"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Pronto para começar?
            </h2>
            <p className="text-white/50 mt-4 text-sm sm:text-base max-w-lg mx-auto">
              Junte-se a centenas de empresas que já confiam em nossa plataforma para crescer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/cadastro">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 font-medium text-sm px-8 w-full sm:w-auto">
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
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="px-5 sm:px-8 lg:px-16 py-8 border-t border-white/10"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">© 2026 InoovaWeb. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">Termos</a>
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">Privacidade</a>
              <a href="#" className="text-sm text-white/40 hover:text-white/70 transition-colors">Contato</a>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default LandingPage;
