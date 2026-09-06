import type { Contrato } from "@/domain/entities";
import { mesesAtras } from "./helpers";
import { ocupacoesMock } from "./ocupacoes.mock";
import { addMonths, format } from "date-fns";

function fimContrato(inicio: string, meses: number): string {
  return format(addMonths(new Date(`${inicio}T12:00:00`), meses), "yyyy-MM-dd");
}

const porId = new Map(ocupacoesMock.map((o) => [o.id, o]));

export const contratosMock: Contrato[] = [
  {
    id: "ctr_01",
    ocupacaoId: "ocp_01",
    numero: "2021/0001",
    status: "encerrado",
    condicoes: {
      valorAluguel: 3200,
      valorCaucao: 6400,
      diaVencimento: 5,
      prazoMeses: 30,
      indiceReajuste: "IGP-M",
      dataInicio: porId.get("ocp_01")!.dataEntrada,
      dataFim: fimContrato(porId.get("ocp_01")!.dataEntrada, 30),
    },
    arquivoPdfUrl: null,
    dataGeracao: null,
    criadoEm: mesesAtras(58, 1),
  },
  {
    id: "ctr_02",
    ocupacaoId: "ocp_02",
    numero: "2022/0004",
    status: "encerrado",
    condicoes: {
      valorAluguel: 3650,
      valorCaucao: 7300,
      diaVencimento: 10,
      prazoMeses: 30,
      indiceReajuste: "IPCA",
      dataInicio: porId.get("ocp_02")!.dataEntrada,
      dataFim: fimContrato(porId.get("ocp_02")!.dataEntrada, 30),
      clausulasAdicionais:
        "Fica autorizada a instalação de ar-condicionado nos dormitórios, às custas do locatário.",
    },
    arquivoPdfUrl: null,
    dataGeracao: null,
    criadoEm: mesesAtras(37, 15),
  },
  {
    id: "ctr_03",
    ocupacaoId: "ocp_03",
    numero: "2024/0011",
    status: "vigente",
    condicoes: {
      valorAluguel: 4100,
      valorCaucao: 8200,
      diaVencimento: 10,
      prazoMeses: 30,
      indiceReajuste: "IGP-M",
      dataInicio: porId.get("ocp_03")!.dataEntrada,
      dataFim: fimContrato(porId.get("ocp_03")!.dataEntrada, 30),
    },
    arquivoPdfUrl: null,
    dataGeracao: null,
    criadoEm: mesesAtras(15, 1),
  },
  {
    id: "ctr_04",
    ocupacaoId: "ocp_04",
    numero: "2023/0007",
    status: "vigente",
    condicoes: {
      valorAluguel: 5800,
      valorCaucao: 11600,
      diaVencimento: 5,
      prazoMeses: 36,
      indiceReajuste: "IPCA",
      dataInicio: porId.get("ocp_04")!.dataEntrada,
      dataFim: fimContrato(porId.get("ocp_04")!.dataEntrada, 36),
      clausulasAdicionais:
        "Permitida a permanência de até dois animais de pequeno porte, mediante conservação do imóvel.",
    },
    arquivoPdfUrl: null,
    dataGeracao: null,
    criadoEm: mesesAtras(24, 1),
  },
  {
    id: "ctr_05",
    ocupacaoId: "ocp_05",
    numero: "2024/0002",
    status: "vigente",
    condicoes: {
      valorAluguel: 12000,
      valorCaucao: 36000,
      diaVencimento: 15,
      prazoMeses: 60,
      indiceReajuste: "IGP-M",
      dataInicio: porId.get("ocp_05")!.dataEntrada,
      dataFim: fimContrato(porId.get("ocp_05")!.dataEntrada, 60),
      clausulasAdicionais:
        "Contrato atípico (built to suit) com garantia de fiança bancária equivalente a 12 aluguéis.",
    },
    arquivoPdfUrl: null,
    dataGeracao: null,
    criadoEm: mesesAtras(20, 10),
  },
  {
    id: "ctr_06",
    ocupacaoId: "ocp_06",
    numero: "2022/0001",
    status: "encerrado",
    condicoes: {
      valorAluguel: 2450,
      valorCaucao: 4900,
      diaVencimento: 8,
      prazoMeses: 36,
      indiceReajuste: "IGP-M",
      dataInicio: porId.get("ocp_06")!.dataEntrada,
      dataFim: fimContrato(porId.get("ocp_06")!.dataEntrada, 36),
    },
    arquivoPdfUrl: null,
    dataGeracao: null,
    criadoEm: mesesAtras(42, 1),
  },
];
