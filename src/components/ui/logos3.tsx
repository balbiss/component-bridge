"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
}

const Logos3 = ({
  heading = "Empresas que confiam na InoovaWeb",
  logos = [
    { id: "logo-1", description: "Astro", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/astro-wordmark.svg", className: "h-7 w-auto" },
    { id: "logo-2", description: "Figma", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/figma-wordmark.svg", className: "h-7 w-auto" },
    { id: "logo-3", description: "Next.js", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/nextjs-wordmark.svg", className: "h-7 w-auto" },
    { id: "logo-4", description: "React", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/react-wordmark.svg", className: "h-7 w-auto" },
    { id: "logo-5", description: "shadcn/ui", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcn-ui-wordmark.svg", className: "h-7 w-auto" },
    { id: "logo-6", description: "Supabase", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/supabase-wordmark.svg", className: "h-7 w-auto" },
    { id: "logo-7", description: "Tailwind CSS", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/tailwind-wordmark.svg", className: "h-4 w-auto" },
    { id: "logo-8", description: "Vercel", image: "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/vercel-wordmark.svg", className: "h-7 w-auto" },
  ],
}: Logos3Props) => {
  return (
    <section className="px-5 sm:px-8 lg:px-16 py-12">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm font-medium text-white/40 mb-8">
          {heading}
        </p>
        <div className="relative">
          <div className="flex overflow-hidden">
            <Carousel
              opts={{ loop: true }}
              plugins={[AutoScroll({ playOnInit: true, speed: 0.7 })]}
            >
              <CarouselContent className="ml-0">
                {logos.map((logo) => (
                  <CarouselItem
                    key={logo.id}
                    className="basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 pl-0"
                  >
                    <div className="flex items-center justify-center h-16 px-4">
                      <img
                        src={logo.image}
                        alt={logo.description}
                        className={`${logo.className || "h-7 w-auto"} opacity-50 hover:opacity-80 transition-opacity brightness-0 invert`}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[hsl(260,60%,10%)] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[hsl(260,60%,10%)] to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
