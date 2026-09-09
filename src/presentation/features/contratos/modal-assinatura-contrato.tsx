"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileCheck2, Send, Upload } from "lucide-react";
import type { Contrato } from "@/domain/entities";
import type { ResumoInquilino } from "@/application/dtos";
import {
  enviarContratoParaAssinatura,
  registrarAssinaturaManual,
} from "@/app/_actions/contratos";
import { formatarDataHora, formatarTelefone } from "@/lib/formatters";
import { Button, Field, Input, Modal } from "@/presentation/components/ui";
import { StatusAssinaturaBadge } from "./status-assinatura-badge";

function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}

const ROTULO_ORIGEM = { digital: "assinado pelo WhatsApp", sistema: "documento importado" } as const;

/**
 * Reúne os dois caminhos para fechar a assinatura de um contrato: encaminhar
 * por WhatsApp para assinatura digital (aciona o webhook do n8n) ou registrar
 * manualmente um documento já assinado fora do sistema.
 */
export function ModalAssinaturaContrato({
  aberto,
  aoFechar,
  contrato,
  inquilino,
}: {
  aberto: boolean;
  aoFechar: () => void;
  contrato: Contrato;
  inquilino: ResumoInquilino;
}) {
  const router = useRouter();
  const [telefone, setTelefone] = useState(formatarTelefone(inquilino.telefone));
  const [enviando, setEnviando] = useState(false);
  const [importando, setImportando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  async function enviarParaAssinatura() {
    setEnviando(true);
    const resultado = await enviarContratoParaAssinatura(contrato.id, telefone);
    setEnviando(false);

    if (!resultado.sucesso) {
      toast.error(resultado.erro);
      return;
    }

    toast.success(`Contrato ${resultado.dados.numero} encaminhado para assinatura.`);
    router.refresh();
    aoFechar();
  }

  async function aoSelecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;

    setImportando(true);
    try {
      const conteudo = await lerComoDataUrl(arquivo);
      const resultado = await registrarAssinaturaManual(contrato.id, {
        nome: arquivo.name,
        tipo: arquivo.type,
        conteudo,
      });

      if (!resultado.sucesso) {
        toast.error(resultado.erro);
        return;
      }

      toast.success("Documento assinado registrado.");
      router.refresh();
      aoFechar();
    } catch {
      toast.error("Não foi possível importar o documento.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Assinatura do contrato"
      descricao={`Contrato ${contrato.numero} — ${inquilino.nome}`}
      largura="sm"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5">
          <StatusAssinaturaBadge status={contrato.statusAssinatura} />
          <p className="text-right text-xs text-slate-500">
            {contrato.statusAssinatura === "assinada" && contrato.assinadoEm ? (
              <>
                Em {formatarDataHora(contrato.assinadoEm)}
                {contrato.assinaturaOrigem ? ` · ${ROTULO_ORIGEM[contrato.assinaturaOrigem]}` : ""}
              </>
            ) : contrato.statusAssinatura === "enviada" && contrato.assinaturaEnviadaEm ? (
              <>
                Enviado em {formatarDataHora(contrato.assinaturaEnviadaEm)}
                {contrato.assinaturaTelefone ? ` · ${formatarTelefone(contrato.assinaturaTelefone)}` : ""}
              </>
            ) : (
              "Ainda não enviado"
            )}
          </p>
        </div>

        {contrato.arquivoAssinadoUrl ? (
          <a
            href={contrato.arquivoAssinadoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            <FileCheck2 aria-hidden className="size-4" />
            Ver documento assinado
          </a>
        ) : null}

        <div className="space-y-2.5 border-t border-line pt-4">
          <p className="text-sm font-medium text-slate-900">Enviar para assinatura por WhatsApp</p>
          <p className="text-xs text-slate-500">
            O contrato é encaminhado com o PDF em anexo para o número abaixo, que assina digitalmente
            pelo próprio WhatsApp.
          </p>
          <Field label="Número de WhatsApp" htmlFor="telefone-assinatura">
            <Input
              id="telefone-assinatura"
              value={telefone}
              onChange={(evento) => setTelefone(evento.target.value)}
              placeholder="(18) 99999-9999"
              inputMode="tel"
            />
          </Field>
          <Button
            variante="primario"
            tamanho="md"
            larguraTotal
            onClick={enviarParaAssinatura}
            carregando={enviando}
            disabled={!telefone.trim()}
          >
            <Send aria-hidden className="size-4" />
            Enviar para assinatura
          </Button>
        </div>

        <div className="space-y-2.5 border-t border-line pt-4">
          <p className="text-sm font-medium text-slate-900">Já tenho o documento assinado</p>
          <p className="text-xs text-slate-500">
            Para quando a assinatura foi coletada fora do sistema — importe o PDF já assinado para
            registrá-lo neste contrato.
          </p>
          <input
            ref={inputArquivo}
            type="file"
            accept="application/pdf"
            hidden
            onChange={aoSelecionarArquivo}
          />
          <Button
            variante="secundario"
            tamanho="md"
            larguraTotal
            onClick={() => inputArquivo.current?.click()}
            carregando={importando}
          >
            <Upload aria-hidden className="size-4" />
            Importar documento assinado
          </Button>
        </div>
      </div>
    </Modal>
  );
}
