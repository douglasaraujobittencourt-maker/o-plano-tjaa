import { useState } from "react";

function LoadedLogo({ src, name, className }: { src: string; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img src={src} alt={`Logo de ${name}`} className={className} onError={() => setFailed(true)} />;
}

type ExamLogoImageProps = {
  src?: string | null;
  secondarySrc?: string | null;
  name: string;
  secondaryName?: string;
  className: string;
};

export function ExamLogoImage({ src, secondarySrc, name, secondaryName = "Banco do Brasil", className }: ExamLogoImageProps) {
  if (!src && !secondarySrc) return null;
  // Sem a segunda logo, mantém o comportamento original para os demais consumidores.
  if (!secondarySrc) return src ? <LoadedLogo key={src} src={src} name={name} className={className} /> : null;
  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      {src && <LoadedLogo key={src} src={src} name={name} className={className} />}
      <LoadedLogo key={secondarySrc} src={secondarySrc} name={secondaryName} className={className} />
    </span>
  );
}
