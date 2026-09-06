"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { loginInquilinoSchema, type DadosLoginInquilino } from "@/application/schemas";
import { entrarPortal } from "@/app/_actions/portal";
import { Button, Field, Input } from "@/presentation/components/ui";

export function FormularioLoginInquilino() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosLoginInquilino>({
    resolver: zodResolver(loginInquilinoSchema),
    defaultValues: { documento: "", senha: "" },
  });

  async function aoEnviar(dados: DadosLoginInquilino) {
    const resultado = await entrarPortal(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosLoginInquilino, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(`Olá, ${resultado.dados.nome.split(" ")[0]}!`);
    // Primeiro acesso: leva direto para a troca de senha, que permite pular.
    router.replace(resultado.dados.usandoSenhaPadrao ? "/portal/senha?primeiro=1" : "/portal");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
      <Field
        label="CPF ou CNPJ"
        htmlFor="portal-documento"
        obrigatorio
        erro={errors.documento?.message}
        dica="Pode digitar com ou sem pontuação."
      >
        <Input
          id="portal-documento"
          inputMode="numeric"
          autoComplete="username"
          placeholder="000.000.000-00"
          invalido={!!errors.documento}
          {...register("documento")}
        />
      </Field>

      <Field label="Senha" htmlFor="portal-senha" obrigatorio erro={errors.senha?.message}>
        <Input
          id="portal-senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalido={!!errors.senha}
          {...register("senha")}
        />
      </Field>

      <Button type="submit" carregando={isSubmitting} larguraTotal tamanho="lg">
        <LogIn aria-hidden className="size-4" />
        Entrar
      </Button>
    </form>
  );
}
