"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Imovel, Inquilino } from "@/domain/entities";
import { entradaSchema, type DadosEntradaForm } from "@/application/schemas";
import { registrarEntrada } from "@/app/_actions/ocupacoes";
import {
  Button,
  Field,
  Input,
  InputMoeda,
  Modal,
  Select,
  Textarea,
} from "@/presentation/components/ui";

/**
 * Registrar entrada só oferece imóveis sem ocupação ativa — a regra também é
 * checada no caso de uso, mas a UI evita o erro antes de acontecer.
 */
export function FormularioEntrada({
  aberto,
  aoFechar,
  imoveisDisponiveis,
  inquilinos,
  imovelPreSelecionado,
}: {
  aberto: boolean;
  aoFechar: () => void;
  imoveisDisponiveis: Imovel[];
  inquilinos: Inquilino[];
  imovelPreSelecionado?: string;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosEntradaForm>({
    resolver: zodResolver(entradaSchema),
    defaultValues: {
      imovelId: imovelPreSelecionado ?? "",
      inquilinoId: "",
      dataEntrada: format(new Date(), "yyyy-MM-dd"),
      valorAluguel: 0,
      diaVencimento: 5,
      valorCaucao: 0,
      observacoes: "",
    },
  });

  const imovelId = watch("imovelId");

  // Ao escolher o imóvel, sugere aluguel e caução com base no anúncio.
  useEffect(() => {
    const imovel = imoveisDisponiveis.find((i) => i.id === imovelId);
    if (!imovel) return;
    setValue("valorAluguel", imovel.valorAluguel);
    setValue("valorCaucao", imovel.valorAluguel * 2);
  }, [imovelId, imoveisDisponiveis, setValue]);

  async function aoEnviar(dados: DadosEntradaForm) {
    const resultado = await registrarEntrada(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosEntradaForm, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success("Entrada registrada. O imóvel foi marcado como alugado.");
    reset();
    aoFechar();
    router.push(`/admin/ocupacoes/${resultado.dados.id}`);
    router.refresh();
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Registrar entrada"
      descricao="Vincule um inquilino a um imóvel disponível."
      largura="lg"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="form-entrada" type="submit" carregando={isSubmitting}>
            Registrar entrada
          </Button>
        </>
      }
    >
      <form id="form-entrada" onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
        {imoveisDisponiveis.length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Nenhum imóvel disponível no momento. Registre a saída de uma ocupação ativa ou marque um
            imóvel como disponível.
          </p>
        ) : null}

        <Field label="Imóvel" htmlFor="entrada-imovel" obrigatorio erro={errors.imovelId?.message}>
          <Select id="entrada-imovel" invalido={!!errors.imovelId} {...register("imovelId")}>
            <option value="">Selecione o imóvel</option>
            {imoveisDisponiveis.map((imovel) => (
              <option key={imovel.id} value={imovel.id}>
                {imovel.titulo} — {imovel.endereco.bairro}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Inquilino"
          htmlFor="entrada-inquilino"
          obrigatorio
          erro={errors.inquilinoId?.message}
        >
          <Select id="entrada-inquilino" invalido={!!errors.inquilinoId} {...register("inquilinoId")}>
            <option value="">Selecione o inquilino</option>
            {inquilinos.map((inquilino) => (
              <option key={inquilino.id} value={inquilino.id}>
                {inquilino.nome}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Data de entrada"
            htmlFor="entrada-data"
            obrigatorio
            erro={errors.dataEntrada?.message}
          >
            <Input
              id="entrada-data"
              type="date"
              invalido={!!errors.dataEntrada}
              {...register("dataEntrada")}
            />
          </Field>

          <Field
            label="Dia de vencimento"
            htmlFor="entrada-vencimento"
            obrigatorio
            erro={errors.diaVencimento?.message}
            dica="Dia do mês, de 1 a 28."
          >
            <Input
              id="entrada-vencimento"
              type="number"
              min={1}
              max={28}
              invalido={!!errors.diaVencimento}
              {...register("diaVencimento")}
            />
          </Field>

          <Field
            label="Aluguel combinado"
            htmlFor="entrada-aluguel"
            obrigatorio
            erro={errors.valorAluguel?.message}
          >
            <InputMoeda
              id="entrada-aluguel"
              invalido={!!errors.valorAluguel}
              {...register("valorAluguel")}
            />
          </Field>

          <Field label="Caução" htmlFor="entrada-caucao" erro={errors.valorCaucao?.message}>
            <InputMoeda id="entrada-caucao" {...register("valorCaucao")} />
          </Field>
        </div>

        <Field label="Observações" htmlFor="entrada-observacoes" erro={errors.observacoes?.message}>
          <Textarea
            id="entrada-observacoes"
            rows={3}
            placeholder="Acordos, condições especiais, itens entregues..."
            {...register("observacoes")}
          />
        </Field>
      </form>
    </Modal>
  );
}
