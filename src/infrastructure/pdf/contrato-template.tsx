import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DadosContratoPdf, ParteContrato } from "@/domain/services";

/**
 * Preto no branco, como o contrato em papel que a imobiliária já usa: sem cor
 * de marca, sem fundo, sem faixa. O cinza aparece só onde precisa recuar
 * (rótulos e rodapé), nunca como decoração.
 */
const PRETO = "#000000";
const CINZA = "#444444";

const estilos = StyleSheet.create({
  pagina: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontSize: 11,
    color: PRETO,
    lineHeight: 1.55,
  },
  titulo: { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 },
  preambulo: { marginTop: 8, marginBottom: 4 },
  numero: { fontSize: 9, color: CINZA, marginTop: 2 },

  parte: { marginTop: 14 },
  rotuloParte: { fontWeight: 700, textTransform: "uppercase", marginBottom: 4 },
  linhaDado: { flexDirection: "row", marginBottom: 2 },
  rotulo: { width: 74, color: CINZA },
  valor: { flex: 1 },

  clausula: { marginTop: 14 },
  tituloClausula: { fontWeight: 700, textTransform: "uppercase", marginBottom: 3 },
  paragrafo: { textAlign: "justify", marginBottom: 5 },

  fecho: { marginTop: 22 },
  assinaturas: { marginTop: 34 },
  campoAssinatura: { marginBottom: 26 },
  // A linha de assinatura é uma régua larga, como no contrato impresso.
  risco: { borderTopWidth: 1, borderTopColor: PRETO, width: 300, marginBottom: 4 },

  /**
   * Rodapé repetido em todas as páginas. É um Text absoluto com `fixed`, e o
   * conteúdo é estático de propósito: a prop `render`, que daria "Página X de
   * Y", não imprime nada no @react-pdf/renderer 4.9 — verificado em PDF gerado.
   */
  rodape: {
    position: "absolute",
    bottom: 30,
    left: 56,
    right: 56,
    textAlign: "center",
    fontSize: 8,
    color: CINZA,
  },
});

const moeda = (valor: number) =>
  `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const data = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("pt-BR");
};

const dataPorExtenso = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
};

const UNIDADES = [
  "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez",
  "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove",
];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];

/** Números por extenso até 999 — suficiente para prazos de contrato em meses. */
function porExtenso(valor: number): string {
  if (valor < 20) return UNIDADES[valor] ?? String(valor);
  if (valor < 100) {
    const dezena = Math.floor(valor / 10);
    const unidade = valor % 10;
    return unidade === 0 ? DEZENAS[dezena] : `${DEZENAS[dezena]} e ${UNIDADES[unidade]}`;
  }
  if (valor === 100) return "cem";
  const centena = Math.floor(valor / 100);
  const resto = valor % 100;
  const nomesCentena = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  return resto === 0 ? nomesCentena[centena] : `${nomesCentena[centena]} e ${porExtenso(resto)}`;
}

function Dado({ rotulo, valor }: { rotulo: string; valor?: string }) {
  if (!valor) return null;
  return (
    <View style={estilos.linhaDado}>
      <Text style={estilos.rotulo}>{rotulo}:</Text>
      <Text style={estilos.valor}>{valor}</Text>
    </View>
  );
}

/**
 * Bloco de qualificação de uma parte. Segue a ordem do contrato em papel —
 * nome, profissão, RG, CPF, endereço — e omite o que não foi preenchido.
 */
function Qualificacao({
  rotulo,
  parte,
  rotuloDocumento,
}: {
  rotulo: string;
  parte: ParteContrato;
  rotuloDocumento: string;
}) {
  return (
    <View style={estilos.parte} wrap={false}>
      <Text style={estilos.rotuloParte}>{rotulo}</Text>
      <Dado rotulo="Nome" valor={parte.nome} />
      <Dado rotulo="Profissão" valor={parte.profissao} />
      <Dado rotulo="RG" valor={parte.rg} />
      <Dado rotulo={rotuloDocumento} valor={parte.documento} />
      <Dado rotulo="Endereço" valor={parte.endereco} />
      <Dado rotulo="Telefone" valor={parte.telefone} />
    </View>
  );
}

/**
 * A cláusula pode quebrar entre páginas — travá-la inteira deixaria meia folha
 * em branco. O que não pode é o título ficar órfão no pé da página, daí o
 * `minPresenceAhead`: ele só é impresso se houver espaço para o texto começar.
 */
function Clausula({ titulo, children }: { titulo: string; children: string | string[] }) {
  const paragrafos = Array.isArray(children) ? children : [children];
  return (
    <View style={estilos.clausula}>
      <Text style={estilos.tituloClausula} minPresenceAhead={48}>
        {titulo}
      </Text>
      {paragrafos.map((texto, indice) => (
        <Text key={indice} style={estilos.paragrafo}>
          {texto}
        </Text>
      ))}
    </View>
  );
}

function Assinatura({ rotulo, nome }: { rotulo: string; nome: string }) {
  return (
    <View style={estilos.campoAssinatura} wrap={false}>
      <View style={estilos.risco} />
      <Text>
        {rotulo} — {nome.toUpperCase()}
      </Text>
    </View>
  );
}

/**
 * Template do contrato de locação, decalcado do modelo em papel usado pela
 * imobiliária: preâmbulo, qualificação das partes e as cláusulas de objeto,
 * prazo, valor e conservação.
 *
 * É um componente React puro sobre `DadosContratoPdf`: não busca nada em
 * repositório, o que o torna previsível e fácil de ajustar visualmente.
 */
export function ContratoPdfDocument({ dados }: { dados: DadosContratoPdf }) {
  const { condicoes: c, imovel, locador, locatario, natureza } = dados;

  const residencial = natureza === "residencial";
  const tipoContrato = residencial ? "residencial" : "comercial";
  const finalidade = residencial ? "fins de moradia" : "fins comerciais";

  // "LOCADORA" quando a locadora é mulher, "LOCADOR" quando não — o artigo do
  // texto das cláusulas acompanha, para o contrato não sair com concordância errada.
  const LOCADOR = (locador.rotulo || "LOCADOR").toUpperCase();
  const artigo = LOCADOR.endsWith("A") ? "A" : "O";
  const artigoMinusculo = artigo === "A" ? "a" : "o";
  const documentoLocador = locador.documento?.length === 18 ? "CNPJ" : "CPF";

  const clausulaValor = [
    `O valor do aluguel é de ${moeda(c.valorAluguel)} mensais, a serem pagos pelo LOCATÁRIO até o dia ${c.diaVencimento} de cada mês, mediante recibo fornecido pel${artigoMinusculo} ${LOCADOR}.`,
  ];
  if (c.valorCaucao > 0) {
    clausulaValor.push(
      `A título de garantia, o LOCATÁRIO depositou a quantia de ${moeda(c.valorCaucao)}, que será restituída ao final da locação, descontados eventuais débitos e danos apurados no imóvel.`,
    );
  }
  if (c.indiceReajuste && c.prazoMeses >= 12) {
    clausulaValor.push(
      `O aluguel será reajustado a cada 12 (doze) meses pela variação acumulada do ${c.indiceReajuste}, ou por índice que legalmente o substitua.`,
    );
  }

  return (
    <Document
      title={`Contrato de Locação ${dados.numero}`}
      author={locador.nome}
      subject={`Locação — ${imovel.titulo}`}
    >
      <Page size="A4" style={estilos.pagina}>
        <Text style={estilos.titulo}>Contrato de Locação {tipoContrato}</Text>
        <Text style={estilos.numero}>
          Nº {dados.numero} · Emitido em {data(dados.dataEmissao)}
        </Text>
        <Text style={estilos.preambulo}>
          Pelo presente instrumento particular, as partes abaixo identificadas:
        </Text>

        <Qualificacao rotulo={LOCADOR} parte={locador} rotuloDocumento={documentoLocador} />
        <Qualificacao rotulo="Locatário" parte={locatario} rotuloDocumento="CPF" />

        <Clausula titulo="Cláusula 1 — Objeto">
          {`${artigo} ${LOCADOR} dá em locação ao LOCATÁRIO o imóvel ${tipoContrato} situado na ${imovel.enderecoCompleto}${imovel.areaM2 ? `, com área de ${imovel.areaM2.toLocaleString("pt-BR")} m²` : ""}, exclusivamente para ${finalidade}.`}
        </Clausula>

        <Clausula titulo="Cláusula 2 — Prazo">
          {`O prazo de locação é de ${c.prazoMeses} (${porExtenso(c.prazoMeses)}) meses, iniciando-se em ${data(c.dataInicio)} e encerrando-se em ${data(c.dataFim)}. Findo o prazo, o contrato poderá ser renovado mediante novo acordo por escrito entre as partes.`}
        </Clausula>

        <Clausula titulo="Cláusula 3 — Valor e pagamento">{clausulaValor}</Clausula>

        <Clausula titulo="Cláusula 4 — Conservação">
          {[
            `O LOCATÁRIO se compromete a conservar o imóvel, responsabilizando-se por danos que venham a ocorrer, salvo aqueles decorrentes do desgaste natural pelo uso normal.`,
            `Correm por conta do LOCATÁRIO as despesas de água, energia elétrica e demais consumos individualizados do período da locação.`,
            `Não pagar em dia implica quebra de contrato, ficando ${artigoMinusculo} ${LOCADOR} livre para pedir que se retirem do imóvel antes do término do contrato.`,
            `A destinação do imóvel não pode ser mudada sem consentimento expresso d${artigoMinusculo} ${LOCADOR}.`,
          ]}
        </Clausula>

        {c.clausulasAdicionais ? (
          <Clausula titulo="Cláusula 5 — Disposições adicionais">{c.clausulasAdicionais}</Clausula>
        ) : null}

        <View style={estilos.fecho} wrap={false}>
          <Text style={estilos.paragrafo}>
            {`E por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor.`}
          </Text>
          <Text>
            {dados.cidadeAssinatura}, {dataPorExtenso(dados.dataEmissao)}.
          </Text>

          <View style={estilos.assinaturas}>
            <Assinatura rotulo={LOCADOR} nome={locador.nome} />
            <Assinatura rotulo="LOCATÁRIO" nome={locatario.nome} />
          </View>
        </View>

        <Text style={estilos.rodape} fixed>
          Contrato nº {dados.numero}
        </Text>
      </Page>
    </Document>
  );
}
