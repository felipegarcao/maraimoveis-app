"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { OcupacaoDetalhada } from "@/application/dtos";
import type { Pagamento } from "@/domain/entities";
import { cobrancaSchema, type DadosCobrancaForm } from "@/application/schemas";
import { editarCobranca, registrarCobranca } from "@/app/_actions/financeiro";
import { Button, Field, Input, InputMoeda, Modal, Select } from "@/presentation/components/ui";

export function FormularioCobranca({
  aberto,
  aoFechar,
  ocupacoesAtivas,
  cobranca,
  ocupacaoPreSelecionada,
}: {
  aberto: boolean;
  aoFechar: () => void;
  ocupacoesAtivas: OcupacaoDetalhada[];
  cobranca?: Pagamento;
  ocupacaoPreSelecionada?: string;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosCobrancaForm>({
    resolver: zodResolver(cobrancaSchema),
    defaultValues: cobranca
      ? {
          ocupacaoId: cobranca.ocupacaoId,
          mesReferencia: cobranca.mesReferencia,
          valorAluguel: cobranca.valorAluguel,
          valorAgua: cobranca.valorAgua,
          valorLuz: cobranca.valorLuz,
          outrosValores: cobranca.outrosValores,
          descricaoOutros: cobranca.descricaoOutros ?? "",
          dataVencimento: cobranca.dataVencimento,
        }
      : {
          ocupacaoId: ocupacaoPreSelecionada ?? "",
          mesReferencia: format(new Date(), "yyyy-MM"),
          valorAluguel: 0,
          valorAgua: 0,
          valorLuz: 0,
          outrosValores: 0,
          descricaoOutros: "",
          dataVencimento: "",
        },
  });

  const ocupacaoId = watch("ocupacaoId");
  const [aluguel, agua, luz, outros] = watch([
    "valorAluguel",
    "valorAgua",
    "valorLuz",
    "outrosValores",
  ]);

  // O aluguel vem da ocupação; água e luz variam a cada mês e são digitados.
  useEffect(() => {
    if (cobranca) return;
    const escolhida = ocupacoesAtivas.find((o) => o.ocupacao.id === ocupacaoId);
    if (escolhida) setValue("valorAluguel", escolhida.ocupacao.valorAluguel);
  }, [ocupacaoId, ocupacoesAtivas, setValue, cobranca]);

  const total =
    (Number(aluguel) || 0) + (Number(agua) || 0) + (Number(luz) || 0) + (Number(outros) || 0);

  async function aoEnviar(dados: DadosCobrancaForm) {
    const resultado = cobranca
      ? await editarCobranca(cobranca.id, dados)
      : await registrarCobranca(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosCobrancaForm, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(cobranca ? "Cobrança atualizada." : "Cobrança lançada.");
    aoFechar();
    router.refresh();
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={cobranca ? "Editar cobrança" : "Lançar cobrança do mês"}
      descricao="Aluguel, água, luz e outros valores do período."
      largura="md"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="form-cobranca" type="submit" carregando={isSubmitting}>
            {cobranca ? "Salvar" : "Lançar cobrança"}
          </Button>
        </>
      }
    >
      <form id="form-cobranca" onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Ocupação"
            htmlFor="cobranca-ocupacao"
            obrigatorio
            erro={errors.ocupacaoId?.message}
            className="sm:col-span-2"
          >
            <Select
              id="cobranca-ocupacao"
              disabled={Boolean(cobranca)}
              invalido={!!errors.ocupacaoId}
              {...register("ocupacaoId")}
            >
              <option value="">Selecione a ocupação</option>
              {ocupacoesAtivas.map((o) => (
                <option key={o.ocupacao.id} value={o.ocupacao.id}>
                  {o.inquilino.nome} — {o.imovel.titulo}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Mês de referência"
            htmlFor="cobranca-mes"
            obrigatorio
            erro={errors.mesReferencia?.message}
          >
            <Input
              id="cobranca-mes"
              type="month"
              disabled={Boolean(cobranca)}
              invalido={!!errors.mesReferencia}
              {...register("mesReferencia")}
            />
          </Field>

          <Field
            label="Vencimento"
            htmlFor="cobranca-vencimento"
            erro={errors.dataVencimento?.message}
            dica="Vazio usa o dia da ocupação."
          >
            <Input id="cobranca-vencimento" type="date" {...register("dataVencimento")} />
          </Field>

          <Field
            label="Aluguel"
            htmlFor="cobranca-aluguel"
            obrigatorio
            erro={errors.valorAluguel?.message}
          >
            <InputMoeda
              id="cobranca-aluguel"
              invalido={!!errors.valorAluguel}
              {...register("valorAluguel")}
            />
          </Field>

          <Field label="Água" htmlFor="cobranca-agua" erro={errors.valorAgua?.message}>
            <InputMoeda id="cobranca-agua" {...register("valorAgua")} />
          </Field>

          <Field label="Luz" htmlFor="cobranca-luz" erro={errors.valorLuz?.message}>
            <InputMoeda id="cobranca-luz" {...register("valorLuz")} />
          </Field>

          <Field label="Outros valores" htmlFor="cobranca-outros" erro={errors.outrosValores?.message}>
            <InputMoeda id="cobranca-outros" {...register("outrosValores")} />
          </Field>

          <Field
            label="Descrição dos outros valores"
            htmlFor="cobranca-descricao"
            erro={errors.descricaoOutros?.message}
            className="sm:col-span-2"
          >
            <Input
              id="cobranca-descricao"
              placeholder="Ex: IPTU parcelado, reparo hidráulico"
              {...register("descricaoOutros")}
            />
          </Field>
        </div>

        <p className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2.5 text-sm">
          <span className="font-medium text-slate-700">Total da cobrança</span>
          <span className="text-base font-semibold tabular-nums text-brand-700">
            {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
        </p>
      </form>
    </Modal>
  );
}
