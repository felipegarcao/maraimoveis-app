"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Foto de imóvel com placeholder para o caso de a imagem não carregar
 * (URL externa fora do ar, arquivo removido do storage).
 */
export function ImagemImovel({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [falhou, setFalhou] = useState(false);

  if (!src || falhou) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-slate-100 text-slate-300",
          className,
        )}
      >
        <ImageOff aria-hidden className="size-8" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFalhou(true)}
      className={cn("object-cover", className)}
    />
  );
}
