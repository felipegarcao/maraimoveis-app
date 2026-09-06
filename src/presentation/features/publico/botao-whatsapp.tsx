import { MessageCircle } from "lucide-react";
import { linkWhatsApp } from "@/lib/whatsapp";
import { classesBotao } from "@/presentation/components/ui";
import { cn } from "@/lib/utils";

/** Atalho para abrir a conversa no WhatsApp com mensagem pronta. */
export function BotaoWhatsApp({
  telefone,
  mensagem,
  rotulo = "Falar no WhatsApp",
  variante = "primario",
  tamanho = "md",
  className,
}: {
  telefone?: string;
  mensagem: string;
  rotulo?: string;
  variante?: "primario" | "secundario" | "suave" | "fantasma";
  tamanho?: "sm" | "md" | "lg" | "icone";
  className?: string;
}) {
  return (
    <a
      href={linkWhatsApp(telefone, mensagem)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        classesBotao(variante, tamanho, className),
        variante === "primario" && "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
      )}
    >
      <MessageCircle aria-hidden className="size-4" />
      {rotulo}
    </a>
  );
}
