"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";
import { contatoSchema, type DadosContato } from "@/application/schemas";
import { enviarContato } from "@/app/_actions/contato";
import { Button, Field, Input, Textarea } from "@/presentation/components/ui";

/**
 * Formulário de contato. O mesmo schema zod valida no cliente (feedback imediato)
 * e dentro da Server Action (segurança), sem duplicar regra.
 */
export function FormularioContato({
  imovelId,
  imovelTitulo,
}: {
  imovelId?: string;
  imovelTitulo?: string;
}) {
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosContato>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      mensagem: imovelTitulo ? `Olá! Tenho interesse no imóvel "${imovelTitulo}".` : "",
      imovelId: imovelId ?? null,
    },
  });

  async function aoEnviar(dados: DadosContato) {
    const resultado = await enviarContato(dados);

    if (!resultado.sucesso) {
      // Erros de campo devolvidos pelo servidor voltam para o formulário.
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosContato, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    setEnviado(true);
    reset({ nome: "", email: "", telefone: "", mensagem: "", imovelId: imovelId ?? null });
    toast.success("Mensagem enviada! Retornaremos em breve.");
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center rounded-card border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center">
        <CheckCircle2 aria-hidden className="size-10 text-emerald-600" />
        <h3 className="mt-3 text-base font-semibold text-slate-900">Mensagem enviada!</h3>
        <p className="mt-1.5 max-w-sm text-sm text-slate-600">
          Recebemos seu contato e vamos responder no e-mail ou telefone informado. Se preferir,
          chame direto no WhatsApp.
        </p>
        <Button variante="secundario" className="mt-5" onClick={() => setEnviado(false)}>
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
      <Field label="Nome completo" htmlFor="contato-nome" obrigatorio erro={errors.nome?.message}>
        <Input
          id="contato-nome"
          autoComplete="name"
          placeholder="Como podemos te chamar?"
          invalido={!!errors.nome}
          aria-describedby={errors.nome ? "contato-nome-erro" : undefined}
          {...register("nome")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail" htmlFor="contato-email" obrigatorio erro={errors.email?.message}>
          <Input
            id="contato-email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            invalido={!!errors.email}
            aria-describedby={errors.email ? "contato-email-erro" : undefined}
            {...register("email")}
          />
        </Field>

        <Field
          label="Telefone / WhatsApp"
          htmlFor="contato-telefone"
          obrigatorio
          erro={errors.telefone?.message}
          dica="Com DDD, ex: 11 98765-4321"
        >
          <Input
            id="contato-telefone"
            type="tel"
            autoComplete="tel"
            placeholder="(11) 98765-4321"
            invalido={!!errors.telefone}
            aria-describedby={errors.telefone ? "contato-telefone-erro" : "contato-telefone-dica"}
            {...register("telefone")}
          />
        </Field>
      </div>

      <Field label="Mensagem" htmlFor="contato-mensagem" obrigatorio erro={errors.mensagem?.message}>
        <Textarea
          id="contato-mensagem"
          rows={5}
          placeholder="Conte o que você procura, melhores horários para visita..."
          invalido={!!errors.mensagem}
          aria-describedby={errors.mensagem ? "contato-mensagem-erro" : undefined}
          {...register("mensagem")}
        />
      </Field>

      <input type="hidden" {...register("imovelId")} />

      <Button type="submit" carregando={isSubmitting} larguraTotal tamanho="lg">
        <Send aria-hidden className="size-4" />
        Enviar mensagem
      </Button>

      <p className="text-center text-xs text-slate-500">
        Ao enviar, você concorda em ser contatado sobre imóveis disponíveis.
      </p>
    </form>
  );
}
