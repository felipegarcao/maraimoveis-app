import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DadosContratoPdf } from "@/domain/services";

const cores = { texto: "#0f172a", suave: "#475569", linha: "#cbd5e1", marca: "#1d4ed8" };

const estilos = StyleSheet.create({
  pagina: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 52, fontSize: 10, color: cores.texto, lineHeight: 1.6 },
  cabecalho: { borderBottomWidth: 2, borderBottomColor: cores.marca, paddingBottom: 10, marginBottom: 20 },
  marca: { fontSize: 9, color: cores.marca, letterSpacing: 1.2, textTransform: "uppercase" },
  titulo: { fontSize: 15, marginTop: 6, fontWeight: 700 },
  numero: { fontSize: 9, color: cores.suave, marginTop: 2 },
  secao: { marginTop: 14 },
  tituloSecao: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 },
  paragrafo: { textAlign: "justify", marginBottom: 6 },
  parte: { backgroundColor: "#f8fafc", borderLeftWidth: 3, borderLeftColor: cores.marca, padding: 10, marginBottom: 8 },
  rotuloParte: { fontSize: 8, color: cores.suave, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  nomeParte: { fontSize: 11, fontWeight: 700 },
  linhaDado: { flexDirection: "row", marginBottom: 3 },
  rotulo: { width: 118, color: cores.suave },
  valor: { flex: 1, fontWeight: 700 },
  clausula: { marginBottom: 8 },
  tituloClausula: { fontWeight: 700, marginBottom: 2 },
  assinaturas: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
  campoAssinatura: { width: "45%", borderTopWidth: 1, borderTopColor: cores.linha, paddingTop: 6, alignItems: "center" },
  textoAssinatura: { fontSize: 9 },
  legendaAssinatura: { fontSize: 8, color: cores.suave, marginTop: 2 },
  rodape: { position: "absolute", bottom: 28, left: 52, right: 52, borderTopWidth: 1, borderTopColor: cores.linha, paddingTop: 6, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: cores.suave },
});

const moeda = (valor: number) =>
  `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const data = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("pt-BR");
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

const dataPorExtenso = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
};

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linhaDado}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.valor}>{valor}</Text>
    </View>
  );
}

function Clausula({ titulo, children }: { titulo: string; children: string }) {
  return (
    <View style={estilos.clausula} wrap={false}>
      <Text style={estilos.tituloClausula}>{titulo}</Text>
      <Text style={estilos.paragrafo}>{children}</Text>
    </View>
  );
}

/**
 * Template do contrato de locação.
 *
 * É um componente React puro sobre `DadosContratoPdf`: não busca nada em
 * repositório, o que o torna previsível e fácil de ajustar visualmente.
 */
export function ContratoPdfDocument({ dados }: { dados: DadosContratoPdf }) {
  const { condicoes: c, imovel, locador, locatario } = dados;

  return (
    <Document
      title={`Contrato de Locação ${dados.numero}`}
      author={locador.nome}
      subject={`Locação — ${imovel.titulo}`}
    >
      <Page size="A4" style={estilos.pagina}>
        <View style={estilos.cabecalho}>
          <Text style={estilos.marca}>{locador.nome}</Text>
          <Text style={estilos.titulo}>Contrato de Locação de Imóvel</Text>
          <Text style={estilos.numero}>
            Nº {dados.numero} · Emitido em {data(dados.dataEmissao)}
          </Text>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Partes</Text>
          <View style={estilos.parte}>
            <Text style={estilos.rotuloParte}>Locador</Text>
            <Text style={estilos.nomeParte}>{locador.nome}</Text>
            <Text>
              CNPJ/CPF: {locador.documento} · {locador.endereco}
            </Text>
          </View>
          <View style={estilos.parte}>
            <Text style={estilos.rotuloParte}>Locatário</Text>
            <Text style={estilos.nomeParte}>{locatario.nome}</Text>
            <Text>
              {[`CPF/CNPJ: ${locatario.documento}`, locatario.email, locatario.telefone]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </View>
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Objeto da locação</Text>
          <Dado rotulo="Imóvel" valor={imovel.titulo} />
          <Dado rotulo="Tipo" valor={imovel.tipo} />
          <Dado rotulo="Endereço" valor={imovel.enderecoCompleto} />
          <Dado rotulo="Área privativa" valor={`${imovel.areaM2} m²`} />
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Condições financeiras</Text>
          <Dado rotulo="Aluguel mensal" valor={moeda(c.valorAluguel)} />
          <Dado rotulo="Caução" valor={moeda(c.valorCaucao)} />
          <Dado rotulo="Vencimento" valor={`Todo dia ${c.diaVencimento} de cada mês`} />
          <Dado rotulo="Prazo" valor={`${c.prazoMeses} meses`} />
          <Dado rotulo="Vigência" valor={`${data(c.dataInicio)} a ${data(c.dataFim)}`} />
          <Dado rotulo="Índice de reajuste" valor={c.indiceReajuste} />
        </View>

        <View style={estilos.secao}>
          <Text style={estilos.tituloSecao}>Cláusulas</Text>

          <Clausula titulo="Cláusula 1ª — Do objeto">
            {`O LOCADOR dá em locação ao LOCATÁRIO o imóvel descrito acima, destinado exclusivamente ao uso previsto neste instrumento, que declara receber em perfeitas condições de uso, conservação e habitabilidade, conforme laudo de vistoria que integra este contrato.`}
          </Clausula>

          <Clausula titulo="Cláusula 2ª — Do prazo">
            {`A locação vigorará pelo prazo de ${c.prazoMeses} (${porExtenso(c.prazoMeses)}) meses, com início em ${data(c.dataInicio)} e término em ${data(c.dataFim)}, independentemente de aviso, notificação ou interpelação judicial ou extrajudicial.`}
          </Clausula>

          <Clausula titulo="Cláusula 3ª — Do aluguel e do reajuste">
            {`O aluguel mensal é de ${moeda(c.valorAluguel)}, a ser pago até o dia ${c.diaVencimento} de cada mês. O valor será reajustado anualmente pela variação acumulada do ${c.indiceReajuste}, ou por índice que legalmente o substitua.`}
          </Clausula>

          <Clausula titulo="Cláusula 4ª — Dos encargos">
            {`Correm por conta do LOCATÁRIO as despesas de água, energia elétrica, gás, condomínio ordinário e demais consumos individualizados, cujos comprovantes deverão ser apresentados sempre que solicitados pelo LOCADOR.`}
          </Clausula>

          <Clausula titulo="Cláusula 5ª — Da garantia">
            {`A título de garantia locatícia, o LOCATÁRIO deposita a quantia de ${moeda(c.valorCaucao)}, que será restituída ao final da locação, corrigida na forma da lei, descontados eventuais débitos e danos apurados em vistoria de saída.`}
          </Clausula>

          <Clausula titulo="Cláusula 6ª — Da conservação e das benfeitorias">
            {`O LOCATÁRIO obriga-se a manter o imóvel em bom estado de conservação e a restituí-lo nas mesmas condições em que o recebeu. Benfeitorias úteis ou voluptuárias dependem de autorização prévia e por escrito do LOCADOR e não geram direito de retenção ou indenização.`}
          </Clausula>

          <Clausula titulo="Cláusula 7ª — Da rescisão e das penalidades">
            {`A rescisão antecipada por iniciativa do LOCATÁRIO sujeita-o ao pagamento de multa equivalente a 3 (três) aluguéis vigentes, reduzida proporcionalmente ao período já cumprido, nos termos do art. 4º da Lei nº 8.245/1991. O atraso no pagamento implica multa de 2% sobre o valor devido, juros de 1% ao mês e correção monetária.`}
          </Clausula>

          {c.clausulasAdicionais ? (
            <Clausula titulo="Cláusula 8ª — Disposições específicas">{c.clausulasAdicionais}</Clausula>
          ) : null}

          <Clausula titulo={c.clausulasAdicionais ? "Cláusula 9ª — Do foro" : "Cláusula 8ª — Do foro"}>
            {`Fica eleito o foro da comarca de ${dados.cidadeAssinatura} para dirimir quaisquer questões oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`}
          </Clausula>
        </View>

        <View style={estilos.secao} wrap={false}>
          <Text style={estilos.paragrafo}>
            {`E por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, na presença das testemunhas abaixo.`}
          </Text>
          <Text style={{ marginTop: 10 }}>
            {dados.cidadeAssinatura}, {dataPorExtenso(dados.dataEmissao)}.
          </Text>

          <View style={estilos.assinaturas}>
            <View style={estilos.campoAssinatura}>
              <Text style={estilos.textoAssinatura}>{locador.nome}</Text>
              <Text style={estilos.legendaAssinatura}>Locador</Text>
            </View>
            <View style={estilos.campoAssinatura}>
              <Text style={estilos.textoAssinatura}>{locatario.nome}</Text>
              <Text style={estilos.legendaAssinatura}>Locatário</Text>
            </View>
          </View>
        </View>

        <View style={estilos.rodape} fixed>
          <Text>Contrato nº {dados.numero}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
