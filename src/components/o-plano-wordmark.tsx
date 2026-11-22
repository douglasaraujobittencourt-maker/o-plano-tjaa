import wordmark from "@/assets/o-plano-logo.svg?raw";

/**
 * The "o.plano" brand wordmark, inlined so the letters follow the surrounding
 * text colour while the dot keeps the brand green. It ships inside the bundle,
 * so it renders on any host (Vercel included) without a separate image request.
 */
export function OPlanoWordmark({ className = "" }: { className?: string }) {
  const svg = className ? wordmark.replace("<svg ", `<svg class="${className}" `) : wordmark;
  return <span dangerouslySetInnerHTML={{ __html: svg }} />;
}
