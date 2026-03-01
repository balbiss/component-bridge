import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Pricing } from '@/components/ui/pricing';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Palette, Zap, Users, Star, Shield } from 'lucide-react';
import { PremiumTestimonials } from '@/components/ui/premium-testimonials';
import { Logos3 } from '@/components/ui/logos3';

// --- ANIMATED AURORA BACKGROUND ---
const AuroraBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

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

          // Purple-themed aurora matching login colors
          vec3 color1 = vec3(0.1, 0.05, 0.2);   // deep purple bg
          vec3 color2 = vec3(0.25, 0.1, 0.45);   // mid purple
          vec3 color3 = vec3(0.4, 0.15, 0.7);    // bright purple accent
          vec3 color4 = vec3(0.15, 0.05, 0.35);  // dark purple

          float n1 = fbm(uv * 3.0 + t);
          float n2 = fbm(uv * 2.0 - t * 0.5 + vec2(5.0));
          float n3 = fbm(uv * 4.0 + t * 0.3 + vec2(10.0));

          vec3 col = mix(color1, color2, n1);
          col = mix(col, color3, n2 * 0.4);
          col = mix(col, color4, n3 * 0.3);

          // Add subtle glow
          float glow = fbm(uv * 1.5 + t * 0.2) * 0.15;
          col += vec3(0.3, 0.1, 0.5) * glow;

          // Vignette
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
  <div className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1">
    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 text-primary-foreground">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-white/60 leading-relaxed">{description}</p>
  </div>
);

// --- STAT ---
const StatBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-3xl sm:text-4xl font-bold text-white">{value}</p>
    <p className="text-sm text-white/50 mt-1">{label}</p>
  </div>
);

// --- MAIN LANDING PAGE ---
const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <AuroraBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Nav */}
        <header className="w-full px-5 sm:px-8 lg:px-16 py-5">
          <nav className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-sm text-white">
                IW
              </div>
              <span className="font-semibold text-white text-lg">InoovaWeb</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">Recursos</a>
              <a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">Planos</a>
              <a href="#stats" className="text-sm text-white/70 hover:text-white transition-colors">Números</a>
              <a href="#cta" className="text-sm text-white/70 hover:text-white transition-colors">Contato</a>
            </div>

            <div className="flex items-center gap-3">
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
          </nav>
        </header>

        {/* Hero */}
        <section className="px-5 sm:px-8 lg:px-16 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                Crie experiências
                <span className="block bg-gradient-to-r from-purple-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  digitais incríveis
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
                Plataforma moderna para construir, gerenciar e escalar suas aplicações web com design elegante e performance excepcional.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
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
              </div>
            </div>
          </div>
        </section>

        {/* Logo Carousel */}
        <Logos3 />

        {/* Features */}
        <section id="features" className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Por que nos escolher?</h2>
              <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm sm:text-base">
                Tudo o que você precisa para construir produtos digitais modernos
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <FeatureCard
                icon={<Code className="w-6 h-6" />}
                title="Código limpo"
                description="Arquitetura moderna com as melhores práticas de desenvolvimento web."
              />
              <FeatureCard
                icon={<Palette className="w-6 h-6" />}
                title="Design elegante"
                description="Interfaces bonitas e intuitivas que encantam seus usuários."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Alta performance"
                description="Aplicações rápidas e otimizadas para a melhor experiência."
              />
              <FeatureCard
                icon={<Shield className="w-6 h-6" />}
                title="Segurança"
                description="Proteção de dados com as mais recentes práticas de segurança."
              />
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Colaboração"
                description="Trabalhe em equipe com ferramentas integradas de colaboração."
              />
              <FeatureCard
                icon={<Star className="w-6 h-6" />}
                title="Suporte dedicado"
                description="Equipe pronta para ajudar em cada etapa do seu projeto."
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <Pricing plans={[
          {
            name: "INICIANTE",
            price: "49",
            yearlyPrice: "39",
            period: "por mês",
            features: [
              "Até 10 projetos",
              "Análises básicas",
              "Suporte em 48 horas",
              "Acesso limitado à API",
              "Suporte da comunidade",
            ],
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
            features: [
              "Projetos ilimitados",
              "Análises avançadas",
              "Suporte em 24 horas",
              "Acesso total à API",
              "Suporte prioritário",
              "Colaboração em equipe",
              "Integrações personalizadas",
            ],
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
            features: [
              "Tudo do Profissional",
              "Soluções personalizadas",
              "Gerente de conta dedicado",
              "Suporte em 1 hora",
              "Autenticação SSO",
              "Segurança avançada",
              "Contratos personalizados",
              "Acordo de SLA",
            ],
            description: "Para grandes organizações",
            buttonText: "Falar com vendas",
            href: "/cadastro",
            isPopular: false,
          },
        ]} />

        {/* Stats */}
        <section id="stats" className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
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

        {/* Testimonials */}
        <PremiumTestimonials />

        {/* CTA */}
        <section id="cta" className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
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
        </section>

        {/* Footer */}
        <footer className="px-5 sm:px-8 lg:px-16 py-8 border-t border-white/10">
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
