import type { Dinheiro, Endereco } from "../value-objects";

export const STATUS_IMOVEL = ["disponivel", "alugado", "manutencao", "inativo"] as const;
export type StatusImovel = (typeof STATUS_IMOVEL)[number];

export const TIPOS_IMOVEL = [
  "apartamento",
  "casa",
  "kitnet",
  "sobrado",
  "comercial",
  "galpao",
] as const;
export type TipoImovel = (typeof TIPOS_IMOVEL)[number];

export interface FotoImovel {
  readonly id: string;
  readonly url: string;
  /** Texto alternativo — obrigatório para acessibilidade da galeria. */
  readonly descricao: string;
  /** Menor valor aparece primeiro; a foto de capa é sempre a de menor ordem. */
  readonly ordem: number;
}

export interface CaracteristicasImovel {
  readonly quartos: number;
  readonly suites: number;
  readonly banheiros: number;
  readonly vagas: number;
  /** Opcional: nem todo imóvel do acervo tem a metragem levantada. */
  readonly areaM2?: number;
  readonly mobiliado: boolean;
  readonly aceitaPet: boolean;
  readonly condominio: boolean;
}

export interface Imovel {
  readonly id: string;
  readonly titulo: string;
  /** Opcional: imóvel pode ser cadastrado antes de o anúncio ser escrito. */
  readonly descricao?: string;
  readonly tipo: TipoImovel;
  readonly status: StatusImovel;
  readonly endereco: Endereco;
  readonly valorAluguel: Dinheiro;
  readonly valorCondominio: Dinheiro;
  readonly valorIptu: Dinheiro;
  readonly caracteristicas: CaracteristicasImovel;
  readonly fotos: readonly FotoImovel[];
  readonly criadoEm: string;
  readonly atualizadoEm: string;
}

export const ROTULOS_STATUS_IMOVEL: Record<StatusImovel, string> = {
  disponivel: "Disponível",
  alugado: "Alugado",
  manutencao: "Em manutenção",
  inativo: "Inativo",
};

export const ROTULOS_TIPO_IMOVEL: Record<TipoImovel, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  kitnet: "Kitnet",
  sobrado: "Sobrado",
  comercial: "Sala comercial",
  galpao: "Galpão",
};

export const Imovel = {
  /** Só imóveis disponíveis aparecem na vitrine pública. */
  ehVisivelAoPublico(imovel: Imovel): boolean {
    return imovel.status === "disponivel";
  },

  /** Foto de capa = menor `ordem`. Retorna `null` quando não há fotos. */
  fotoCapa(imovel: Imovel): FotoImovel | null {
    if (imovel.fotos.length === 0) return null;
    return [...imovel.fotos].sort((a, b) => a.ordem - b.ordem)[0];
  },

  fotosOrdenadas(imovel: Imovel): FotoImovel[] {
    return [...imovel.fotos].sort((a, b) => a.ordem - b.ordem);
  },

  /** Aluguel + condomínio + IPTU: o que o inquilino desembolsa por mês. */
  custoMensalTotal(imovel: Imovel): Dinheiro {
    return (
      Math.round((imovel.valorAluguel + imovel.valorCondominio + imovel.valorIptu) * 100) / 100
    );
  },
};
