"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import type { FotoImovel } from "@/domain/entities";
import { enviarFotoImovel } from "@/app/_actions/imoveis";
import { ImagemImovel } from "@/presentation/components/imagem-imovel";
import { Button, Input } from "@/presentation/components/ui";
import { cn } from "@/lib/utils";

const MAXIMO_FOTOS = 20;

function lerComoDataUrl(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}

/**
 * Upload de múltiplas fotos com reordenação e definição de capa.
 * A ordem é o próprio índice do array — a foto de capa é sempre a primeira.
 */
export function GerenciadorFotos({
  fotos,
  aoAlterar,
  erro,
}: {
  fotos: FotoImovel[];
  aoAlterar: (fotos: FotoImovel[]) => void;
  erro?: string;
}) {
  const [enviando, setEnviando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  function reordenar(lista: FotoImovel[]): FotoImovel[] {
    return lista.map((foto, indice) => ({ ...foto, ordem: indice }));
  }

  async function aoSelecionarArquivos(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    evento.target.value = "";
    if (arquivos.length === 0) return;

    if (fotos.length + arquivos.length > MAXIMO_FOTOS) {
      toast.error(`Máximo de ${MAXIMO_FOTOS} fotos por imóvel.`);
      return;
    }

    setEnviando(true);
    const novas: FotoImovel[] = [];

    for (const arquivo of arquivos) {
      try {
        const conteudo = await lerComoDataUrl(arquivo);
        const resultado = await enviarFotoImovel({
          nome: arquivo.name,
          tipo: arquivo.type,
          conteudo,
        });

        if (!resultado.sucesso) {
          toast.error(`${arquivo.name}: ${resultado.erro}`);
          continue;
        }

        novas.push({
          id: resultado.dados.chave,
          url: resultado.dados.url,
          descricao: arquivo.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
          ordem: 0,
        });
      } catch {
        toast.error(`Não foi possível enviar ${arquivo.name}.`);
      }
    }

    setEnviando(false);
    if (novas.length > 0) {
      aoAlterar(reordenar([...fotos, ...novas]));
      toast.success(`${novas.length} ${novas.length === 1 ? "foto adicionada" : "fotos adicionadas"}.`);
    }
  }

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= fotos.length) return;
    const lista = [...fotos];
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    aoAlterar(reordenar(lista));
  }

  function definirCapa(indice: number) {
    if (indice === 0) return;
    const lista = [...fotos];
    const [escolhida] = lista.splice(indice, 1);
    aoAlterar(reordenar([escolhida, ...lista]));
  }

  function remover(indice: number) {
    aoAlterar(reordenar(fotos.filter((_, i) => i !== indice)));
  }

  function alterarDescricao(indice: number, descricao: string) {
    aoAlterar(fotos.map((foto, i) => (i === indice ? { ...foto, descricao } : foto)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Fotos do imóvel</p>
          <p className="text-xs text-slate-500">
            A primeira foto é a capa. JPG, PNG ou WebP até 5 MB cada.
          </p>
        </div>
        <Button
          type="button"
          variante="secundario"
          onClick={() => inputArquivo.current?.click()}
          carregando={enviando}
          disabled={fotos.length >= MAXIMO_FOTOS}
        >
          <ImagePlus aria-hidden className="size-4" />
          Adicionar fotos
        </Button>
        <input
          ref={inputArquivo}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={aoSelecionarArquivos}
          className="sr-only"
          aria-label="Selecionar fotos do imóvel"
        />
      </div>

      {erro ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {erro}
        </p>
      ) : null}

      {fotos.length === 0 ? (
        <button
          type="button"
          onClick={() => inputArquivo.current?.click()}
          className="mt-3 flex w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-line px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
        >
          {enviando ? (
            <Loader2 aria-hidden className="size-7 animate-spin text-brand-500" />
          ) : (
            <ImagePlus aria-hidden className="size-7 text-slate-400" />
          )}
          <span className="mt-3 text-sm font-medium text-slate-700">
            {enviando ? "Enviando fotos..." : "Clique para adicionar fotos"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            Você pode selecionar várias de uma vez
          </span>
        </button>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((foto, indice) => (
            <li
              key={foto.id}
              className={cn(
                "overflow-hidden rounded-card border bg-surface",
                indice === 0 ? "border-brand-300 ring-1 ring-brand-200" : "border-line",
              )}
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <ImagemImovel src={foto.url} alt={foto.descricao} sizes="240px" />
                {indice === 0 ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-medium text-white">
                    <Star aria-hidden className="size-3 fill-current" />
                    Capa
                  </span>
                ) : null}
              </div>

              <div className="space-y-2 p-2.5">
                <label className="sr-only" htmlFor={`descricao-foto-${indice}`}>
                  Descrição da foto {indice + 1}
                </label>
                <Input
                  id={`descricao-foto-${indice}`}
                  value={foto.descricao}
                  onChange={(e) => alterarDescricao(indice, e.target.value)}
                  placeholder="Descreva a foto (acessibilidade)"
                  className="h-8 text-xs"
                />

                <div className="flex items-center justify-between gap-1">
                  <div className="flex gap-0.5">
                    <BotaoIcone
                      rotulo="Mover para a esquerda"
                      onClick={() => mover(indice, -1)}
                      disabled={indice === 0}
                    >
                      <ArrowLeft aria-hidden className="size-3.5" />
                    </BotaoIcone>
                    <BotaoIcone
                      rotulo="Mover para a direita"
                      onClick={() => mover(indice, 1)}
                      disabled={indice === fotos.length - 1}
                    >
                      <ArrowRight aria-hidden className="size-3.5" />
                    </BotaoIcone>
                    <BotaoIcone
                      rotulo="Definir como capa"
                      onClick={() => definirCapa(indice)}
                      disabled={indice === 0}
                    >
                      <Star aria-hidden className="size-3.5" />
                    </BotaoIcone>
                  </div>
                  <BotaoIcone rotulo="Remover foto" onClick={() => remover(indice)} destrutivo>
                    <Trash2 aria-hidden className="size-3.5" />
                  </BotaoIcone>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BotaoIcone({
  rotulo,
  onClick,
  disabled,
  destrutivo,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  disabled?: boolean;
  destrutivo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "rounded-md p-1.5 transition-colors disabled:opacity-35",
        destrutivo
          ? "text-red-500 hover:bg-red-50"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
      )}
    >
      {children}
    </button>
  );
}
