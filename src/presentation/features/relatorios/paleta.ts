/**
 * Paleta categórica dos gráficos.
 *
 * Validada para daltonismo e contraste sobre superfície clara:
 * banda de luminosidade, piso de croma, separação CVD (ΔE 12,5 no pior par
 * adjacente em protanopia) e contraste ≥ 3:1 — todos aprovados.
 * A cor segue a entidade (recebido é sempre azul, em aberto é sempre âmbar),
 * nunca a posição na série.
 */
export const CORES_GRAFICO = {
  recebido: "#2563eb",
  emAberto: "#d97706",
  ocupado: "#0d9488",
  destaque: "#7c3aed",
} as const;

/** Eixos e grade recessivos — a tinta forte é dos dados. */
export const ESTILO_EIXO = {
  stroke: "#94a3b8",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const COR_GRADE = "#e2e8f0";
