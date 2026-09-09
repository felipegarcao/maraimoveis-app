"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileDown, FileSignature, Pencil, Send, Trash2 } from "lucide-react";
import type { Contrato } from "@/domain/entities";
import type { OcupacaoDetalhada, ResumoInquilino } from "@/application/dtos";
import {
  enviarContratoWebhook,
  excluirContrato,
  gerarContratoPdf,
} from "@/app/_actions/contratos";
import {
  Button,
  ConfirmDialog,
  ItemMenu,
  MenuAcoes,
  classesBotao,
} from "@/presentation/components/ui";
import { FormularioContrato } from "./formulario-contrato";
import { ModalAssinaturaContrato } from "./modal-assinatura-contrato";

/**
 * Ação primária (Abrir/Gerar PDF) fica visível; o resto — assinatura, reenvio,
 * edição, exclusão — vai para um menu "⋮". Antes eram até 6 botões lado a
 * lado em cada linha da tabela; a lista ficava ilegível.
 */
export function AcoesContrato({
  contrato,
  ocupacoes,
  inquilino,
  compacto = false,
  envioDisponivel = false,
}: {
  contrato: Contrato;
  ocupacoes: OcupacaoDetalhada[];
  /** Necessário só para pré-preencher o telefone no modal de assinatura. */
  inquilino: ResumoInquilino;
  compacto?: boolean;
  /** Sem webhook configurado no servidor não há para onde enviar: o item some. */
  envioDisponivel?: boolean;
}) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const tamanho = compacto ? "sm" : "md";

  async function gerar() {
    setGerando(true);
    // O botão de disparo pode estar dentro do menu, que já fechou quando o
    // clique chega aqui — sem o toast, gerar/regerar ficaria sem nenhum
    // feedback visível até o PDF abrir.
    const idToast = toast.loading("Gerando PDF...");
    const resultado = await gerarContratoPdf(contrato.id);
    setGerando(false);
    toast.dismiss(idToast);

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
    const idToast = toast.loading("Enviando para o WhatsApp...");
    const resultado = await enviarContratoWebhook(contrato.id);
    setEnviando(false);
    toast.dismiss(idToast);

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
      <div className="flex items-center gap-2">
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
        ) : (
          <Button variante="secundario" tamanho={tamanho} onClick={gerar} carregando={gerando}>
            <FileDown aria-hidden className="size-4" />
            Gerar PDF
          </Button>
        )}

        <MenuAcoes>
          {contrato.arquivoPdfUrl ? (
            <ItemMenu icone={FileDown} carregando={gerando} onClick={gerar}>
              Regerar PDF
            </ItemMenu>
          ) : null}

          <ItemMenu icone={FileSignature} onClick={() => setAssinando(true)}>
            Assinatura
          </ItemMenu>

          {envioDisponivel ? (
            <ItemMenu icone={Send} carregando={enviando} onClick={enviar}>
              Enviar WhatsApp
            </ItemMenu>
          ) : null}

          <ItemMenu icone={Pencil} onClick={() => setEditando(true)}>
            Editar
          </ItemMenu>

          {contrato.status !== "vigente" ? (
            <>
              <div role="separator" className="my-1 border-t border-line" />
              <ItemMenu icone={Trash2} tom="perigo" onClick={() => setConfirmando(true)}>
                Excluir
              </ItemMenu>
            </>
          ) : null}
        </MenuAcoes>
      </div>

      {editando ? (
        <FormularioContrato
          aberto={editando}
          aoFechar={() => setEditando(false)}
          ocupacoes={ocupacoes}
          contrato={contrato}
        />
      ) : null}

      {assinando ? (
        <ModalAssinaturaContrato
          aberto={assinando}
          aoFechar={() => setAssinando(false)}
          contrato={contrato}
          inquilino={inquilino}
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
