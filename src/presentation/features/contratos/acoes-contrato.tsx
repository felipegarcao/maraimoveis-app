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
 * Duas apresentações para as mesmas ações. `menu`: linha da tabela desktop —
 * só a ação primária fica visível, o resto vai para o popover "⋮" (com 6
 * botões lado a lado a linha ficava ilegível). Sem `menu` (padrão, usado nos
 * cards do mobile): todas as ações como botões tocáveis — há espaço vertical
 * de sobra no card, e um popover custa um toque a mais que não compensa ali.
 */
export function AcoesContrato({
  contrato,
  ocupacoes,
  inquilino,
  compacto = false,
  menu = false,
  envioDisponivel = false,
}: {
  contrato: Contrato;
  ocupacoes: OcupacaoDetalhada[];
  /** Necessário só para pré-preencher o telefone no modal de assinatura. */
  inquilino: ResumoInquilino;
  compacto?: boolean;
  /** Ações secundárias atrás de um menu "⋮" — pensado para a linha da tabela. */
  menu?: boolean;
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
    // No layout de menu o popover já fechou quando o clique chega aqui — sem
    // o toast, gerar/regerar ficaria sem nenhum feedback visível até o PDF abrir.
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

  const abrirOuGerarPdf = contrato.arquivoPdfUrl ? (
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
  );

  return (
    <>
      {menu ? (
        <div className="flex items-center gap-2">
          {abrirOuGerarPdf}

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
      ) : (
        <div className="flex flex-wrap gap-2">
          {abrirOuGerarPdf}

          <Button variante="secundario" tamanho={tamanho} onClick={() => setAssinando(true)}>
            <FileSignature aria-hidden className="size-4" />
            Assinatura
          </Button>

          {contrato.arquivoPdfUrl ? (
            <Button variante="secundario" tamanho={tamanho} onClick={gerar} carregando={gerando}>
              <FileDown aria-hidden className="size-4" />
              Regerar
            </Button>
          ) : null}

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
      )}

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
