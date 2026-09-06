"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import {
  ROTULOS_STATUS_IMOVEL,
  ROTULOS_TIPO_IMOVEL,
  STATUS_IMOVEL,
  TIPOS_IMOVEL,
  type Imovel,
} from "@/domain/entities";
import { imovelSchema, type DadosImovel } from "@/application/schemas";
import { criarImovel, editarImovel } from "@/app/_actions/imoveis";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Field,
  Input,
  InputMoeda,
  Select,
  Textarea,
  classesBotao,
} from "@/presentation/components/ui";
import { GerenciadorFotos } from "./gerenciador-fotos";

const VALORES_INICIAIS: DadosImovel = {
  titulo: "",
  descricao: "",
  tipo: "apartamento",
  status: "disponivel",
  endereco: {
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "SP",
    cep: "",
  },
  valorAluguel: 0,
  valorCondominio: 0,
  valorIptu: 0,
  caracteristicas: {
    quartos: 1,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    areaM2: 0,
    mobiliado: false,
    aceitaPet: false,
    condominio: false,
  },
  fotos: [],
};

export function FormularioImovel({ imovel }: { imovel?: Imovel }) {
  const router = useRouter();
  const editando = Boolean(imovel);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosImovel>({
    resolver: zodResolver(imovelSchema),
    defaultValues: imovel
      ? {
          titulo: imovel.titulo,
          descricao: imovel.descricao,
          tipo: imovel.tipo,
          status: imovel.status,
          endereco: { ...imovel.endereco, complemento: imovel.endereco.complemento ?? "" },
          valorAluguel: imovel.valorAluguel,
          valorCondominio: imovel.valorCondominio,
          valorIptu: imovel.valorIptu,
          caracteristicas: { ...imovel.caracteristicas },
          fotos: [...imovel.fotos],
        }
      : VALORES_INICIAIS,
  });

  async function aoEnviar(dados: DadosImovel) {
    const resultado = imovel ? await editarImovel(imovel.id, dados) : await criarImovel(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as never, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(editando ? "Imóvel atualizado." : "Imóvel cadastrado.");
    router.push(`/admin/imoveis/${resultado.dados.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-5 pb-4">
      <Card>
        <CardHeader titulo="Informações principais" descricao="Como o imóvel aparece no anúncio." />
        <CardBody className="space-y-4">
          <Field label="Título do anúncio" htmlFor="titulo" obrigatorio erro={errors.titulo?.message}>
            <Input
              id="titulo"
              placeholder="Ex: Apartamento reformado em Pinheiros"
              invalido={!!errors.titulo}
              {...register("titulo")}
            />
          </Field>

          <Field
            label="Descrição"
            htmlFor="descricao"
            obrigatorio
            erro={errors.descricao?.message}
            dica="Detalhe acabamentos, entorno, transporte e diferenciais."
          >
            <Textarea
              id="descricao"
              rows={6}
              invalido={!!errors.descricao}
              {...register("descricao")}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="tipo" obrigatorio erro={errors.tipo?.message}>
              <Select id="tipo" invalido={!!errors.tipo} {...register("tipo")}>
                {TIPOS_IMOVEL.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {ROTULOS_TIPO_IMOVEL[tipo]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Situação"
              htmlFor="status"
              obrigatorio
              erro={errors.status?.message}
              dica="Só imóveis disponíveis aparecem no site público."
            >
              <Select id="status" invalido={!!errors.status} {...register("status")}>
                {STATUS_IMOVEL.map((status) => (
                  <option key={status} value={status}>
                    {ROTULOS_STATUS_IMOVEL[status]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader titulo="Endereço" />
        <CardBody className="grid gap-4 sm:grid-cols-6">
          <Field
            label="Logradouro"
            htmlFor="logradouro"
            obrigatorio
            erro={errors.endereco?.logradouro?.message}
            className="sm:col-span-4"
          >
            <Input
              id="logradouro"
              autoComplete="street-address"
              invalido={!!errors.endereco?.logradouro}
              {...register("endereco.logradouro")}
            />
          </Field>

          <Field
            label="Número"
            htmlFor="numero"
            obrigatorio
            erro={errors.endereco?.numero?.message}
            className="sm:col-span-2"
          >
            <Input id="numero" invalido={!!errors.endereco?.numero} {...register("endereco.numero")} />
          </Field>

          <Field
            label="Complemento"
            htmlFor="complemento"
            erro={errors.endereco?.complemento?.message}
            className="sm:col-span-3"
          >
            <Input id="complemento" placeholder="Apto, bloco..." {...register("endereco.complemento")} />
          </Field>

          <Field
            label="Bairro"
            htmlFor="bairro"
            obrigatorio
            erro={errors.endereco?.bairro?.message}
            className="sm:col-span-3"
          >
            <Input id="bairro" invalido={!!errors.endereco?.bairro} {...register("endereco.bairro")} />
          </Field>

          <Field
            label="Cidade"
            htmlFor="cidade"
            obrigatorio
            erro={errors.endereco?.cidade?.message}
            className="sm:col-span-3"
          >
            <Input id="cidade" invalido={!!errors.endereco?.cidade} {...register("endereco.cidade")} />
          </Field>

          <Field
            label="Estado"
            htmlFor="estado"
            obrigatorio
            erro={errors.endereco?.estado?.message}
            className="sm:col-span-1"
          >
            <Input
              id="estado"
              maxLength={2}
              placeholder="SP"
              invalido={!!errors.endereco?.estado}
              {...register("endereco.estado")}
            />
          </Field>

          <Field
            label="CEP"
            htmlFor="cep"
            obrigatorio
            erro={errors.endereco?.cep?.message}
            className="sm:col-span-2"
          >
            <Input
              id="cep"
              inputMode="numeric"
              placeholder="00000-000"
              invalido={!!errors.endereco?.cep}
              {...register("endereco.cep")}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader titulo="Valores" descricao="Informe os valores mensais cobrados." />
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field label="Aluguel" htmlFor="valorAluguel" obrigatorio erro={errors.valorAluguel?.message}>
            <InputMoeda id="valorAluguel" invalido={!!errors.valorAluguel} {...register("valorAluguel")} />
          </Field>
          <Field label="Condomínio" htmlFor="valorCondominio" erro={errors.valorCondominio?.message}>
            <InputMoeda id="valorCondominio" {...register("valorCondominio")} />
          </Field>
          <Field label="IPTU (mensal)" htmlFor="valorIptu" erro={errors.valorIptu?.message}>
            <InputMoeda id="valorIptu" {...register("valorIptu")} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader titulo="Características" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {(
              [
                ["quartos", "Quartos"],
                ["suites", "Suítes"],
                ["banheiros", "Banheiros"],
                ["vagas", "Vagas"],
                ["areaM2", "Área (m²)"],
              ] as const
            ).map(([campo, rotulo]) => (
              <Field
                key={campo}
                label={rotulo}
                htmlFor={campo}
                erro={errors.caracteristicas?.[campo]?.message}
              >
                <Input
                  id={campo}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  invalido={!!errors.caracteristicas?.[campo]}
                  {...register(`caracteristicas.${campo}`)}
                />
              </Field>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-4">
            <Checkbox label="Mobiliado" {...register("caracteristicas.mobiliado")} />
            <Checkbox label="Aceita pet" {...register("caracteristicas.aceitaPet")} />
            <Checkbox label="Tem condomínio" {...register("caracteristicas.condominio")} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Controller
            control={control}
            name="fotos"
            render={({ field }) => (
              <GerenciadorFotos
                fotos={field.value}
                aoAlterar={field.onChange}
                erro={errors.fotos?.message}
              />
            )}
          />
        </CardBody>
      </Card>

      <div className="sticky bottom-16 z-10 flex flex-col-reverse gap-2 rounded-card border border-line bg-surface/95 p-3 shadow-lift backdrop-blur sm:bottom-0 sm:flex-row sm:justify-end">
        <Link
          href={imovel ? `/admin/imoveis/${imovel.id}` : "/admin/imoveis"}
          className={classesBotao("secundario", "md")}
        >
          <X aria-hidden className="size-4" />
          Cancelar
        </Link>
        <Button type="submit" carregando={isSubmitting}>
          <Save aria-hidden className="size-4" />
          {editando ? "Salvar alterações" : "Cadastrar imóvel"}
        </Button>
      </div>
    </form>
  );
}
