"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "./modal";
import { Button } from "./button";

/**
 * Confirmação para ações destrutivas.
 * Recebe a ação como função assíncrona e cuida sozinho do estado de carregamento.
 */
export function ConfirmDialog({
  aberto,
  aoFechar,
  aoConfirmar,
  titulo,
  descricao,
  textoConfirmar = "Confirmar",
  destrutivo = true,
}: {
  aberto: boolean;
  aoFechar: () => void;
  aoConfirmar: () => Promise<void> | void;
  titulo: string;
  descricao: ReactNode;
  textoConfirmar?: string;
  destrutivo?: boolean;
}) {
  const [processando, setProcessando] = useState(false);

  async function confirmar() {
    setProcessando(true);
    try {
      await aoConfirmar();
      aoFechar();
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={processando ? () => {} : aoFechar}
      titulo={titulo}
      largura="sm"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar} disabled={processando}>
            Cancelar
          </Button>
          <Button
            variante={destrutivo ? "perigo" : "primario"}
            onClick={confirmar}
            carregando={processando}
          >
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-slate-600">{descricao}</div>
    </Modal>
  );
}
