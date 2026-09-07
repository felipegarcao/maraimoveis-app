"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileDown, Pencil, Send, Trash2 } from "lucide-react";
import type { Contrato } from "@/domain/entities";
import type { OcupacaoDetalhada } from "@/application/dtos";
import {
  enviarContratoWebhook,
  excluirContrato,
  gerarContratoPdf,
} from "@/app/_actions/contratos";
import { Button, ConfirmDialog, classesBotao } from "@/presentation/components/ui";
import { FormularioContrato } from "./formulario-contrato";

export function AcoesContrato({
  contrato,
  ocupacoes,
  compacto = false,
  envioDisponivel = false,
}: {
  contrato: Contrato;
  ocupacoes: OcupacaoDetalhada[];
  compacto?: boolean;
  /** Sem webhook configurado no servidor não há para onde enviar: o botão some. */
  envioDisponivel?: boolean;
}) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const tamanho = compacto ? "sm" : "md";

  async function gerar() {
    setGerando(true);
    const resultado = await gerarContratoPdf(contrato.id);
    setGerando(false);

    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }

    toast.success(`PDF do contrato ${resultado.dados.numero} gerado.`);
    router.refresh();
    window.open(resultado.dados.url, "_blank", "noopener");
  }

  async function enviar() {
    setEnviando(true);
    const resultado = await enviarContratoWebhook(contrato.id);
    setEnviando(false);

    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }

    toast.success(`Contrato ${resultado.dados.numero} enviado para o fluxo do WhatsApp.`);
    router.refresh();
  }

  async function confirmarExclusao() {
    const resultado = await excluirContrato(contrato.id);
    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }
    toast.success("Contrato excluído.");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {contrato.arquivoPdfUrl ? (
          <a
            href={contrato.arquivoPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={classesBotao("suave", tamanho)}
          >
            <Download aria-hidden className="size-4" />
            Abrir PDF
          </a>
        ) : null}

        <Button variante="secundario" tamanho={tamanho} onClick={gerar} carregando={gerando}>
          <FileDown aria-hidden className="size-4" />
          {contrato.arquivoPdfUrl ? "Regerar" : "Gerar PDF"}
        </Button>

        {envioDisponivel ? (
          <Button variante="secundario" tamanho={tamanho} onClick={enviar} carregando={enviando}>
            <Send aria-hidden className="size-4" />
            Enviar WhatsApp
          </Button>
        ) : null}

        <Button variante="secundario" tamanho={tamanho} onClick={() => setEditando(true)}>
          <Pencil aria-hidden className="size-4" />
          <span className={compacto ? "sr-only" : undefined}>Editar</span>
        </Button>

        {contrato.status !== "vigente" ? (
          <Button variante="perigoSuave" tamanho={tamanho} onClick={() => setConfirmando(true)}>
            <Trash2 aria-hidden className="size-4" />
            <span className={compacto ? "sr-only" : undefined}>Excluir</span>
          </Button>
        ) : null}
      </div>

      {editando ? (
        <FormularioContrato
          aberto={editando}
          aoFechar={() => setEditando(false)}
          ocupacoes={ocupacoes}
          contrato={contrato}
        />
      ) : null}

      <ConfirmDialog
        aberto={confirmando}
        aoFechar={() => setConfirmando(false)}
        aoConfirmar={confirmarExclusao}
        titulo="Excluir contrato"
        textoConfirmar="Excluir"
        descricao={
          <p>
            O contrato <strong>{contrato.numero}</strong> e o PDF gerado serão removidos. A ocupação
            e o histórico financeiro não são afetados.
          </p>
        }
      />
    </>
  );
}
