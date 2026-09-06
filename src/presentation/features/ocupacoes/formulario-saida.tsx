"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { MOTIVOS_SAIDA, ROTULOS_MOTIVO_SAIDA } from "@/domain/entities";
import { saidaSchema, type DadosSaidaForm } from "@/application/schemas";
import { registrarSaida } from "@/app/_actions/ocupacoes";
import { Button, Field, Input, Modal, Select, Textarea } from "@/presentation/components/ui";

export function FormularioSaida({
  aberto,
  aoFechar,
  ocupacaoId,
  saldoDevedor,
}: {
  aberto: boolean;
  aoFechar: () => void;
  ocupacaoId: string;
  saldoDevedor: number;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosSaidaForm>({
    resolver: zodResolver(saidaSchema),
    defaultValues: {
      dataSaida: format(new Date(), "yyyy-MM-dd"),
      motivoSaida: "fim_contrato",
      condicoesEntrega: "",
      novoStatusImovel: "disponivel",
    },
  });

  async function aoEnviar(dados: DadosSaidaForm) {
    const resultado = await registrarSaida(ocupacaoId, dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosSaidaForm, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success("Saída registrada. O histórico da ocupação continua acessível.");
    aoFechar();
    router.refresh();
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Registrar saída"
      descricao="A ocupação será encerrada, mas todo o histórico permanece salvo."
      largura="md"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="form-saida" type="submit" carregando={isSubmitting}>
            Encerrar ocupação
          </Button>
        </>
      }
    >
      <form id="form-saida" onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
        {saldoDevedor > 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Atenção: esta ocupação ainda tem{" "}
            <strong>
              {saldoDevedor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </strong>{" "}
            em aberto. O saldo continuará registrado no histórico do inquilino após a saída.
          </p>
        ) : null}

        <Field label="Data de saída" htmlFor="saida-data" obrigatorio erro={errors.dataSaida?.message}>
          <Input id="saida-data" type="date" invalido={!!errors.dataSaida} {...register("dataSaida")} />
        </Field>

        <Field label="Motivo" htmlFor="saida-motivo" obrigatorio erro={errors.motivoSaida?.message}>
          <Select id="saida-motivo" {...register("motivoSaida")}>
            {MOTIVOS_SAIDA.map((motivo) => (
              <option key={motivo} value={motivo}>
                {ROTULOS_MOTIVO_SAIDA[motivo]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Condições de entrega"
          htmlFor="saida-condicoes"
          erro={errors.condicoesEntrega?.message}
          dica="Resultado da vistoria, reparos pendentes, devolução da caução."
        >
          <Textarea id="saida-condicoes" rows={4} {...register("condicoesEntrega")} />
        </Field>

        <Field
          label="Situação do imóvel após a saída"
          htmlFor="saida-status"
          obrigatorio
          erro={errors.novoStatusImovel?.message}
        >
          <Select id="saida-status" {...register("novoStatusImovel")}>
            <option value="disponivel">Disponível — voltar a anunciar</option>
            <option value="manutencao">Em manutenção — reforma antes de anunciar</option>
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
