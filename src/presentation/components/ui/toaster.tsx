"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Feedback de sucesso/erro para todas as Server Actions.
 *
 * O deslocamento vertical é essencial, não estético: os cabeçalhos são fixos e
 * têm 64px de altura. Sem afastar o toast, ele fica por cima do menu do usuário
 * e do botão "Sair" e engole os cliques enquanto está visível.
 *
 * `mobileOffset` precisa ser declarado junto: em telas estreitas o sonner ignora
 * `offset` e usa o valor mobile, que por padrão é 16px.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={{ top: "80px" }}
      mobileOffset={{ top: "76px", left: "12px", right: "12px" }}
      richColors
      closeButton
      toastOptions={{
        style: { borderRadius: "12px", fontFamily: "inherit" },
      }}
    />
  );
}
