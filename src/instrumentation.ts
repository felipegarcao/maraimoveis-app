/**
 * Executado uma vez quando o servidor sobe (antes de atender requisições).
 * É onde a aplicação garante que existe um administrador no banco.
 */
export async function register() {
  // Só no runtime Node: o Edge não tem acesso ao banco nem ao filesystem.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { garantirAdministrador } = await import("./infrastructure/bootstrap");
  await garantirAdministrador();
}
