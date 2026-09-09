"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import type { Inquilino } from "@/domain/entities";
import { inquilinoSchema, type DadosInquilino } from "@/application/schemas";
import { criarInquilino, editarInquilino } from "@/app/_actions/inquilinos";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  classesBotao,
} from "@/presentation/components/ui";

export function FormularioInquilino({ inquilino }: { inquilino?: Inquilino }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosInquilino>({
    resolver: zodResolver(inquilinoSchema),
    defaultValues: inquilino
      ? {
          nome: inquilino.nome,
          tipoDocumento: inquilino.tipoDocumento,
          documento: inquilino.documento,
          rg: inquilino.rg ?? "",
          email: inquilino.email,
          telefone: inquilino.telefone,
          profissao: inquilino.profissao ?? "",
          observacoes: inquilino.observacoes ?? "",
          ativo: inquilino.ativo,
        }
      : {
          nome: "",
          tipoDocumento: "cpf",
          documento: "",
          rg: "",
          email: "",
          telefone: "",
          profissao: "",
          observacoes: "",
          ativo: true,
        },
  });

  const tipoDocumento = watch("tipoDocumento");

  async function aoEnviar(dados: DadosInquilino) {
    const resultado = inquilino
      ? await editarInquilino(inquilino.id, dados)
      : await criarInquilino(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as never, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(inquilino ? "Inquilino atualizado." : "Inquilino cadastrado.");
    router.push(`/admin/inquilinos/${resultado.dados.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-5 pb-4">
      <Card>
        <CardHeader titulo="Dados pessoais" />
        <CardBody className="space-y-4">
          <Field
            label={tipoDocumento === "cnpj" ? "Razão social" : "Nome completo"}
            htmlFor="nome"
            obrigatorio
            erro={errors.nome?.message}
          >
            <Input id="nome" autoComplete="name" invalido={!!errors.nome} {...register("nome")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipo de documento" htmlFor="tipoDocumento" obrigatorio>
              <Select id="tipoDocumento" {...register("tipoDocumento")}>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </Select>
            </Field>

            <Field
              label={tipoDocumento === "cnpj" ? "CNPJ" : "CPF"}
              htmlFor="documento"
              obrigatorio
              erro={errors.documento?.message}
              dica="Somente números ou com pontuação — validamos os dígitos."
            >
              <Input
                id="documento"
                inputMode="numeric"
                placeholder={tipoDocumento === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                invalido={!!errors.documento}
                {...register("documento")}
              />
            </Field>

            <Field
              label={tipoDocumento === "cnpj" ? "Inscrição estadual / RG" : "RG"}
              htmlFor="rg"
              erro={errors.rg?.message}
              dica="Opcional — aparece no contrato ao lado do CPF."
            >
              <Input
                id="rg"
                placeholder="00.000.000-0"
                invalido={!!errors.rg}
                {...register("rg")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="E-mail"
              htmlFor="email"
              erro={errors.email?.message}
              dica="Opcional — o contato obrigatório é o telefone."
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Opcional"
                invalido={!!errors.email}
                {...register("email")}
              />
            </Field>

            <Field
              label="Telefone / WhatsApp"
              htmlFor="telefone"
              obrigatorio
              erro={errors.telefone?.message}
              dica="Com DDD — usado no botão de WhatsApp."
            >
              <Input
                id="telefone"
                type="tel"
                autoComplete="tel"
                placeholder="(11) 98765-4321"
                invalido={!!errors.telefone}
                {...register("telefone")}
              />
            </Field>
          </div>

          <Field label="Profissão / atividade" htmlFor="profissao" erro={errors.profissao?.message}>
            <Input id="profissao" {...register("profissao")} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader titulo="Observações internas" descricao="Visível apenas no painel." />
        <CardBody className="space-y-4">
          <Field label="Anotações" htmlFor="observacoes" erro={errors.observacoes?.message}>
            <Textarea
              id="observacoes"
              rows={4}
              placeholder="Histórico de pagamento, preferências, contatos alternativos..."
              {...register("observacoes")}
            />
          </Field>

          <Checkbox label="Cadastro ativo" {...register("ativo")} />
        </CardBody>
      </Card>

      <div className="sticky bottom-16 z-10 flex flex-col-reverse gap-2 rounded-card border border-line bg-surface/95 p-3 shadow-lift backdrop-blur sm:bottom-0 sm:flex-row sm:justify-end">
        <Link
          href={inquilino ? `/admin/inquilinos/${inquilino.id}` : "/admin/inquilinos"}
          className={classesBotao("secundario", "md")}
        >
          <X aria-hidden className="size-4" />
          Cancelar
        </Link>
        <Button type="submit" carregando={isSubmitting}>
          <Save aria-hidden className="size-4" />
          {inquilino ? "Salvar alterações" : "Cadastrar inquilino"}
        </Button>
      </div>
    </form>
  );
}
