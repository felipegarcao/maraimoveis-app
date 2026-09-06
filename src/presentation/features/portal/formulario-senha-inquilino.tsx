"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, ShieldCheck } from "lucide-react";
import { alterarSenhaSchema, type DadosAlterarSenha } from "@/application/schemas";
import { alterarSenhaPortal } from "@/app/_actions/portal";
import { Button, Field, Input, classesBotao } from "@/presentation/components/ui";

export function FormularioSenhaInquilino({ usandoSenhaPadrao }: { usandoSenhaPadrao: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const primeiroAcesso = searchParams.get("primeiro") === "1";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DadosAlterarSenha>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: { senhaAtual: "", novaSenha: "", confirmacao: "" },
  });

  async function aoEnviar(dados: DadosAlterarSenha) {
    const resultado = await alterarSenhaPortal(dados);

    if (!resultado.sucesso) {
      for (const [campo, mensagem] of Object.entries(resultado.camposInvalidos ?? {})) {
        setError(campo as keyof DadosAlterarSenha, { message: mensagem });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success("Senha alterada. Use a nova senha no próximo acesso.");
    router.replace("/portal");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="space-y-4">
      {usandoSenhaPadrao ? (
        <p className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Você ainda usa a senha padrão (o seu documento). Como ela é previsível, vale trocar
            agora por uma senha só sua.
          </span>
        </p>
      ) : null}

      <Field
        label="Senha atual"
        htmlFor="senha-atual"
        obrigatorio
        erro={errors.senhaAtual?.message}
        dica={usandoSenhaPadrao ? "No primeiro acesso, é o seu CPF ou CNPJ." : undefined}
      >
        <Input
          id="senha-atual"
          type="password"
          autoComplete="current-password"
          invalido={!!errors.senhaAtual}
          {...register("senhaAtual")}
        />
      </Field>

      <Field
        label="Nova senha"
        htmlFor="nova-senha"
        obrigatorio
        erro={errors.novaSenha?.message}
        dica="Pelo menos 8 caracteres. Não pode ser o seu documento."
      >
        <Input
          id="nova-senha"
          type="password"
          autoComplete="new-password"
          invalido={!!errors.novaSenha}
          {...register("novaSenha")}
        />
      </Field>

      <Field
        label="Repita a nova senha"
        htmlFor="confirmacao"
        obrigatorio
        erro={errors.confirmacao?.message}
      >
        <Input
          id="confirmacao"
          type="password"
          autoComplete="new-password"
          invalido={!!errors.confirmacao}
          {...register("confirmacao")}
        />
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        {primeiroAcesso ? (
          <Link href="/portal" className={classesBotao("secundario", "md")}>
            Deixar para depois
          </Link>
        ) : null}
        <Button type="submit" carregando={isSubmitting}>
          <KeyRound aria-hidden className="size-4" />
          Salvar nova senha
        </Button>
      </div>
    </form>
  );
}
