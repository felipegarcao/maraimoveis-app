import { formatarTelefone } from "@/lib/formatters";
import { siteConfig } from "@/lib/config";

interface DadosLeadEmail {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  imovel?: { titulo: string; endereco: string; url: string } | null;
}

/** Template HTML inline — clientes de e-mail não carregam CSS externo. */
export function emailNovoLead(dados: DadosLeadEmail): string {
  const linhaImovel = dados.imovel
    ? `<tr><td style="padding:8px 0;color:#64748b;">Imóvel</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">
         ${escapar(dados.imovel.titulo)}<br />
         <span style="font-weight:400;color:#475569;">${escapar(dados.imovel.endereco)}</span><br />
         <a href="${dados.imovel.url}" style="color:#2563eb;">Ver anúncio</a>
       </td></tr>`
    : "";

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:#2563eb;padding:20px 24px;">
        <p style="margin:0;color:#dbeafe;font-size:13px;">${escapar(siteConfig.nome)}</p>
        <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;">Novo contato pelo site</h1>
      </div>
      <div style="padding:24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:110px;">Nome</td><td style="padding:8px 0;font-weight:600;color:#0f172a;">${escapar(dados.nome)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">E-mail</td><td style="padding:8px 0;"><a href="mailto:${escapar(dados.email)}" style="color:#2563eb;">${escapar(dados.email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Telefone</td><td style="padding:8px 0;color:#0f172a;">${escapar(formatarTelefone(dados.telefone))}</td></tr>
          ${linhaImovel}
        </table>
        <div style="margin-top:16px;padding:16px;background:#f1f5f9;border-radius:10px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.04em;">Mensagem</p>
          <p style="margin:0;color:#0f172a;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapar(dados.mensagem)}</p>
        </div>
      </div>
    </div>
  </div>`;
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
