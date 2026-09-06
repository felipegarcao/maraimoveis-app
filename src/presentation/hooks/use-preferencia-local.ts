"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Preferência de UI guardada no localStorage.
 *
 * `useSyncExternalStore` é o caminho correto aqui: o servidor renderiza o padrão,
 * o cliente sincroniza com o storage depois da hidratação — sem efeito que chama
 * setState nem aviso de mismatch.
 */
const ouvintes = new Set<() => void>();

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    // Modo privado ou storage bloqueado: cai no padrão.
    return null;
  }
}

export function usePreferenciaBooleana(chave: string, padrao = false) {
  const armazenado = useSyncExternalStore(
    useCallback((aoMudar: () => void) => {
      ouvintes.add(aoMudar);
      window.addEventListener("storage", aoMudar);
      return () => {
        ouvintes.delete(aoMudar);
        window.removeEventListener("storage", aoMudar);
      };
    }, []),
    useCallback(() => ler(chave), [chave]),
    () => null,
  );

  const definir = useCallback(
    (proximo: boolean) => {
      try {
        localStorage.setItem(chave, proximo ? "1" : "0");
      } catch {
        // Sem persistência, a preferência vale só para esta sessão.
      }
      for (const ouvinte of ouvintes) ouvinte();
    },
    [chave],
  );

  return [armazenado === null ? padrao : armazenado === "1", definir] as const;
}
