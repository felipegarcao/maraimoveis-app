"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { loginSchema, type DadosLogin } from "@/application/schemas";
import { entrar } from "@/app/_actions/auth";
import { Button, Field, Input } from "@/presentation/components/ui";

export function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proximo = searchParams.get("proximo") || "/admin/dashboard";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  async function aoEnviar(dados: DadosLogin) {
    const resultado = await entrar(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosLogin, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(`Bem-vindo(a), ${resultado.dados.nome}!`);
    router.replace(proximo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
      <Field label="E-mail" htmlFor="login-email" obrigatorio erro={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          placeholder="voce@maraimoveis.com.br"
          invalido={!!errors.email}
          {...register("email")}
        />
      </Field>

      <Field label="Senha" htmlFor="login-senha" obrigatorio erro={errors.senha?.message}>
        <Input
          id="login-senha"
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
