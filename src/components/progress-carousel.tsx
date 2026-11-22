import { useEffect, useState, type ReactNode } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";

export function ProgressCarousel({ children }: { children: [ReactNode, ReactNode] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ align: "start", duration: reducedMotion ? 0 : 25, watchDrag: (_, event) => {
        // Wide tables retain their native horizontal scroll on small screens.
        const target = event.target;
        const table = target instanceof Element ? target.closest("[data-progress-table]") : null;
        return !table || table.scrollWidth <= table.clientWidth;
      } }}
      className="min-w-0 px-10 sm:px-11"
      aria-label="Progresso de estudos"
    >
      <CarouselContent className="items-stretch touch-pan-y">
        {children.map((child, index) => (
          <CarouselItem key={index} aria-label={index === 0 ? "Progresso de Leitura de PDFs" : "Progresso de Videoaulas"} aria-hidden={selected !== index} inert={selected !== index}>
            {child}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0 top-8 translate-y-0" aria-label="Mostrar progresso de PDFs" title="Progresso de PDFs" />
      <CarouselNext className="right-0 top-8 translate-y-0" aria-label="Mostrar progresso de Videoaulas" title="Progresso de Videoaulas" />
      <span className="sr-only" aria-live="polite">{selected === 0 ? "Progresso de Leitura de PDFs, 1 de 2" : "Progresso de Videoaulas, 2 de 2"}</span>
    </Carousel>
  );
}