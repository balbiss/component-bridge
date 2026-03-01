import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Planos simples e transparentes",
  description = "Escolha o plano ideal para você\nTodos os planos incluem acesso à nossa plataforma e suporte dedicado.",
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#6b21a8", "#a855f7", "#c084fc", "#e9d5ff"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <section id="pricing" className="px-5 sm:px-8 lg:px-16 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-4xl font-bold text-white">
            {title}
          </h2>
          <p className="text-white/50 mt-3 max-w-lg mx-auto text-sm sm:text-base whitespace-pre-line">
            {description}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <Switch
            ref={switchRef}
            id="pricing-toggle"
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-white/20"
          />
          <Label htmlFor="pricing-toggle" className="text-sm text-white/70 cursor-pointer">
            Anual (Economize 20%)
          </Label>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={cn(
                "relative rounded-2xl border p-6 sm:p-8 flex flex-col backdrop-blur-sm transition-all duration-300",
                plan.isPopular
                  ? "border-purple-500/50 bg-purple-950/80 scale-[1.02] shadow-xl shadow-purple-500/15"
                  : "border-purple-300/10 bg-purple-950/50 hover:bg-purple-950/70 hover:border-purple-400/20"
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-purple-300/70 tracking-widest mb-4">
                  {plan.name}
                </h3>

                <div className="flex items-baseline gap-1">
                  <span className="text-purple-200 text-sm">R$</span>
                  <NumberFlow
                    value={Number(isMonthly ? plan.price : plan.yearlyPrice)}
                    format={{ useGrouping: false }}
                    transformTiming={{ duration: 500, easing: "ease-out" }}
                    willChange
                    className="text-4xl font-bold text-white tabular-nums"
                  />
                  {plan.period !== "Próximos 3 meses" && (
                    <span className="text-purple-300/50 text-sm ml-1">/ {plan.period}</span>
                  )}
                </div>

                <p className="text-xs text-purple-300/40 mt-2">
                  {isMonthly ? "cobrado mensalmente" : "cobrado anualmente"}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-purple-100/70">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  to={plan.href}
                  className={cn(
                    buttonVariants({ variant: plan.isPopular ? "default" : "outline" }),
                    "w-full text-sm font-medium",
                    plan.isPopular
                      ? "bg-purple-600 text-white hover:bg-purple-500 border-0"
                      : "border-purple-400/30 text-purple-100 hover:bg-purple-800/50 bg-transparent"
                  )}
                >
                  {plan.buttonText}
                </Link>
                <p className="text-xs text-purple-300/40 text-center mt-3">
                  {plan.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
