"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Tema = "default" | "black";

const CHAVE_TEMA = "mara:tema";

interface ContextoTema {
  tema: Tema;
  definirTema: (tema: Tema) => void;
  alternarTema: () => void;
}

const ContextoTemaReact = createContext<ContextoTema | null>(null);

function lerTemaSalvo(): Tema {
  if (typeof window === "undefined") return "default";
  return window.localStorage.getItem(CHAVE_TEMA) === "black" ? "black" : "default";
}

/**
 * Provider de tema da aplicação. O tema é aplicado como `data-theme` no
 * `<html>` — o CSS em `globals.css` reage a esse atributo redefinindo os
 * tokens de cor, então nenhum componente precisa saber qual tema está ativo.
 *
 * O flash do tema padrão no primeiro paint é evitado por `SCRIPT_TEMA_INICIAL`,
 * injetado no `<head>` do layout raiz e executado antes da hidratação.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(lerTemaSalvo);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    window.localStorage.setItem(CHAVE_TEMA, tema);
  }, [tema]);

  const definirTema = useCallback((novoTema: Tema) => setTema(novoTema), []);
  const alternarTema = useCallback(
    () => setTema((atual) => (atual === "black" ? "default" : "black")),
    [],
  );

  return (
    <ContextoTemaReact.Provider value={{ tema, definirTema, alternarTema }}>
      {children}
    </ContextoTemaReact.Provider>
  );
}

export function useTema(): ContextoTema {
  const contexto = useContext(ContextoTemaReact);
  if (!contexto) throw new Error("useTema precisa ser usado dentro de <ThemeProvider>");
  return contexto;
}

/**
 * Script síncrono, executado no `<head>` antes de qualquer pintura, que aplica
 * o tema salvo no `localStorage` diretamente no DOM — sem isso a página
 * nasceria sempre no tema padrão e "piscaria" para preto um instante depois.
 */
export const SCRIPT_TEMA_INICIAL = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA,
)});if(t==="black")document.documentElement.setAttribute("data-theme","black");}catch(e){}})();`;
