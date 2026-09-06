import { NextResponse, type NextRequest } from "next/server";

const COOKIE_ADMIN = "mara_sessao";
const COOKIE_INQUILINO = "mara_sessao_inquilino";

/**
 * Guarda de rotas administrativas.
 *
 * O middleware roda no Edge e só verifica a presença do cookie — a validação
 * da assinatura acontece no servidor, em `exigirSessao()`, antes de cada ação.
 * Ou seja: isto é conveniência de navegação, não a fronteira de segurança.
 */
export function middleware(request: NextRequest) {
  const temSessao = Boolean(request.cookies.get(COOKIE_ADMIN)?.value);
  const temSessaoInquilino = Boolean(request.cookies.get(COOKIE_INQUILINO)?.value);
  const { pathname, search } = request.nextUrl;

  // Portal do inquilino: sessão própria, separada da do painel.
  if (pathname.startsWith("/portal") && pathname !== "/portal/login" && !temSessaoInquilino) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/portal/login" && temSessaoInquilino) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && !temSessao) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?proximo=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && temSessao) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/portal/:path*"],
};
