import type { Lead } from "@/domain/entities";
import { format, subDays } from "date-fns";
import { HOJE } from "./helpers";

const diasAtras = (dias: number) => format(subDays(HOJE, dias), "yyyy-MM-dd'T'HH:mm:ss");

export const leadsMock: Lead[] = [
  {
    id: "led_01",
    nome: "Priscila Tavares",
    email: "priscila.tavares@email.com",
    telefone: "11988776655",
    mensagem:
      "Boa tarde! Tenho interesse no apartamento de Pinheiros. Consigo agendar uma visita no sábado de manhã?",
    origem: "site_imovel",
    imovelId: "imv_01",
    status: "novo",
    criadoEm: diasAtras(1),
  },
  {
    id: "led_02",
    nome: "Ricardo Bomfim",
    email: "ricardo.bomfim@email.com",
    telefone: "11977665544",
    mensagem:
      "Estou procurando uma sala comercial na região da Faria Lima para uma equipe de 12 pessoas. A sala do Itaim ainda está disponível?",
    origem: "site_imovel",
    imovelId: "imv_05",
    status: "em_atendimento",
    criadoEm: diasAtras(4),
  },
  {
    id: "led_03",
    nome: "Camila Ferraz",
    email: "camila.ferraz@email.com",
    telefone: "11966554433",
    mensagem:
      "Olá, vocês têm imóveis de 1 dormitório na zona leste até R$ 2.000? Sou fiadora do meu filho que vai estudar aí.",
    origem: "site_contato",
    imovelId: null,
    status: "novo",
    criadoEm: diasAtras(6),
  },
  {
    id: "led_04",
    nome: "Eduardo Nakamura",
    email: "eduardo.nakamura@email.com",
    telefone: "11955443322",
    mensagem: "Gostaria de saber se a kitnet do Centro aceita contrato de 12 meses com fiador.",
    origem: "site_imovel",
    imovelId: "imv_03",
    status: "descartado",
    criadoEm: diasAtras(19),
  },
];
