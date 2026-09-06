/**
 * Datas do domínio são strings ISO de dia (yyyy-MM-dd), sem hora.
 *
 * `new Date("2026-09-05")` é interpretado como meia-noite UTC, o que no Brasil
 * (UTC-3) cai no dia anterior e faz uma cobrança parecer vencida antes da hora.
 * Ancorar ao meio-dia local elimina essa classe de erro em qualquer fuso.
 */
export function paraDataLocal(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
}
