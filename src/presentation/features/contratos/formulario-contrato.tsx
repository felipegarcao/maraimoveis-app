"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import type { OcupacaoDetalhada } from "@/application/dtos";
import type { Contrato } from "@/domain/entities";
import { contratoSchema, type DadosContrato } from "@/application/schemas";
import { criarContrato, editarContrato } from "@/app/_actions/contratos";
import {
  Button,
  Field,
  Input,
  InputMoeda,
  Modal,
  Select,
  Textarea,
} from "@/presentation/components/ui";

const INDICES = ["IGP-M", "IPCA", "INPC", "IGP-DI"];

export function FormularioContrato({
  aberto,
  aoFechar,
  ocupacoes,
  contrato,
  ocupacaoPreSelecionada,
}: {
  aberto: boolean;
  aoFechar: () => void;
  ocupacoes: OcupacaoDetalhada[];
  contrato?: Contrato;
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
  } = useForm<DadosContrato>({
    resolver: zodResolver(contratoSchema),
    defaultValues: contrato
      ? {
          ocupacaoId: contrato.ocupacaoId,
          prazoMeses: contrato.condicoes.prazoMeses,
          indiceReajuste: contrato.condicoes.indiceReajuste,
          valorAluguel: contrato.condicoes.valorAluguel,
          valorCaucao: contrato.condicoes.valorCaucao,
          diaVencimento: contrato.condicoes.diaVencimento,
          dataInicio: contrato.condicoes.dataInicio,
          clausulasAdicionais: contrato.condicoes.clausulasAdicionais ?? "",
        }
      : {
          ocupacaoId: ocupacaoPreSelecionada ?? "",
          prazoMeses: 30,
          indiceReajuste: "IGP-M",
          valorAluguel: 0,
          valorCaucao: 0,
          diaVencimento: 5,
          dataInicio: "",
          clausulasAdicionais: "",
        },
  });

  const ocupacaoId = watch("ocupacaoId");

  // As condições do contrato herdam o que foi combinado na ocupação.
  useEffect(() => {
    if (contrato) return;
    const escolhida = ocupacoes.find((o) => o.ocupacao.id === ocupacaoId);
    if (!escolhida) return;
    setValue("valorAluguel", escolhida.ocupacao.valorAluguel);
    setValue("valorCaucao", escolhida.ocupacao.valorCaucao);
    setValue("diaVencimento", escolhida.ocupacao.diaVencimento);
    setValue("dataInicio", escolhida.ocupacao.dataEntrada);
  }, [ocupacaoId, ocupacoes, setValue, contrato]);

  async function aoEnviar(dados: DadosContrato) {
    const resultado = contrato
      ? await editarContrato(contrato.id, dados)
      : await criarContrato(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosContrato, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(
      contrato
        ? `Contrato ${resultado.dados.numero} atualizado. Gere o PDF novamente para refletir as mudanças.`
        : `Contrato ${resultado.dados.numero} criado. Agora é só gerar o PDF.`,
    );
    aoFechar();
    router.refresh();
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={contrato ? `Editar contrato ${contrato.numero}` : "Novo contrato"}
      descricao="As condições preenchem automaticamente o PDF do contrato de locação."
      largura="lg"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="form-contrato" type="submit" carregando={isSubmitting}>
            {contrato ? "Salvar alterações" : "Criar contrato"}
          </Button>
        </>
      }
    >
      <form id="form-contrato" onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
        <Field
          label="Ocupação"
          htmlFor="contrato-ocupacao"
          obrigatorio
          erro={errors.ocupacaoId?.message}
        >
          <Select
            id="contrato-ocupacao"
            disabled={Boolean(contrato)}
            invalido={!!errors.ocupacaoId}
            {...register("ocupacaoId")}
          >
            <option value="">Selecione a ocupação</option>
            {ocupacoes.map((o) => (
              <option key={o.ocupacao.id} value={o.ocupacao.id}>
                {o.inquilino.nome} — {o.imovel.titulo}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Início da vigência"
            htmlFor="contrato-inicio"
            obrigatorio
            erro={errors.dataInicio?.message}
          >
            <Input
              id="contrato-inicio"
              type="date"
              invalido={!!errors.dataInicio}
              {...register("dataInicio")}
            />
          </Field>

          <Field
            label="Prazo (meses)"
            htmlFor="contrato-prazo"
            obrigatorio
            erro={errors.prazoMeses?.message}
            dica="O término é calculado automaticamente."
          >
            <Input
              id="contrato-prazo"
              type="number"
              min={1}
              invalido={!!errors.prazoMeses}
              {...register("prazoMeses")}
            />
          </Field>

          <Field
            label="Aluguel"
            htmlFor="contrato-aluguel"
            obrigatorio
            erro={errors.valorAluguel?.message}
          >
            <InputMoeda
              id="contrato-aluguel"
              invalido={!!errors.valorAluguel}
              {...register("valorAluguel")}
            />
          </Field>

          <Field label="Caução" htmlFor="contrato-caucao" erro={errors.valorCaucao?.message}>
            <InputMoeda id="contrato-caucao" {...register("valorCaucao")} />
          </Field>

          <Field
            label="Dia de vencimento"
            htmlFor="contrato-vencimento"
            obrigatorio
            erro={errors.diaVencimento?.message}
          >
            <Input
              id="contrato-vencimento"
              type="number"
              min={1}
              max={28}
              invalido={!!errors.diaVencimento}
              {...register("diaVencimento")}
            />
          </Field>

          <Field
            label="Índice de reajuste"
            htmlFor="contrato-indice"
            obrigatorio
            erro={errors.indiceReajuste?.message}
          >
            <Select id="contrato-indice" {...register("indiceReajuste")}>
              {INDICES.map((indice) => (
                <option key={indice} value={indice}>
                  {indice}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Cláusulas adicionais"
          htmlFor="contrato-clausulas"
          erro={errors.clausulasAdicionais?.message}
          dica="Entram como cláusula específica no PDF. Opcional."
        >
          <Textarea
            id="contrato-clausulas"
            rows={4}
            placeholder="Ex: permitida a permanência de animais de pequeno porte."
            {...register("clausulasAdicionais")}
          />
        </Field>
      </form>
    </Modal>
  );
}
