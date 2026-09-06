import type { Dependencias } from "../ports";
import * as Imoveis from "./imoveis";
import * as Inquilinos from "./inquilinos";
import * as Ocupacoes from "./ocupacoes";
import * as Contratos from "./contratos";
import * as Financeiro from "./financeiro";
import * as Relatorios from "./relatorios";
import * as Auth from "./auth";
import * as Leads from "./leads";
import * as Portal from "./portal";

export * from "./imoveis";
export * from "./inquilinos";
export * from "./ocupacoes";
export * from "./contratos";
export * from "./financeiro";
export * from "./relatorios";
export * from "./auth";
export * from "./leads";
export * from "./portal";

/**
 * Instancia todos os casos de uso a partir das portas.
 * Nenhuma classe concreta é mencionada aqui — quem injeta é o container.
 */
export function criarCasosDeUso(d: Dependencias) {
  const fontesOcupacao = {
    imoveis: d.imoveis,
    inquilinos: d.inquilinos,
    contratos: d.contratos,
    pagamentos: d.pagamentos,
  };
  const fontesFinanceiro = {
    pagamentos: d.pagamentos,
    ocupacoes: d.ocupacoes,
    imoveis: d.imoveis,
    inquilinos: d.inquilinos,
  };

  return {
    imoveis: {
      listarDisponiveis: new Imoveis.ListarImoveisDisponiveis(d.imoveis),
      listar: new Imoveis.ListarImoveis(d.imoveis),
      obter: new Imoveis.ObterImovel(d.imoveis),
      criar: new Imoveis.CriarImovel(d.imoveis),
      editar: new Imoveis.EditarImovel(d.imoveis),
      excluir: new Imoveis.ExcluirImovel(d.imoveis, d.ocupacoes),
      alterarStatus: new Imoveis.AlterarStatusImovel(d.imoveis, d.ocupacoes),
      listarLocalidades: new Imoveis.ListarLocalidades(d.imoveis),
      enviarFoto: new Imoveis.EnviarFotoImovel(d.storage),
    },
    inquilinos: {
      listar: new Inquilinos.ListarInquilinos(d.inquilinos),
      obter: new Inquilinos.ObterInquilino(d.inquilinos),
      criar: new Inquilinos.CriarInquilino(d.inquilinos),
      editar: new Inquilinos.EditarInquilino(d.inquilinos),
      excluir: new Inquilinos.ExcluirInquilino(d.inquilinos, d.ocupacoes),
      historico: new Inquilinos.ObterHistoricoInquilino(
        d.inquilinos,
        d.ocupacoes,
        d.imoveis,
        d.contratos,
        d.pagamentos,
      ),
    },
    ocupacoes: {
      listar: new Ocupacoes.ListarOcupacoes(d.ocupacoes, fontesOcupacao),
      obter: new Ocupacoes.ObterOcupacao(d.ocupacoes, fontesOcupacao),
      registrarEntrada: new Ocupacoes.RegistrarEntrada(d.ocupacoes, d.imoveis, d.inquilinos),
      registrarSaida: new Ocupacoes.RegistrarSaida(d.ocupacoes, d.imoveis, d.contratos),
    },
    contratos: {
      listar: new Contratos.ListarContratos(d.contratos, d.ocupacoes, d.imoveis, d.inquilinos),
      obter: new Contratos.ObterContrato(d.contratos, d.ocupacoes, d.imoveis, d.inquilinos),
      criar: new Contratos.CriarContrato(d.contratos, d.ocupacoes),
      editar: new Contratos.EditarContrato(d.contratos),
      gerarPdf: new Contratos.GerarContratoPdf(
        d.contratos,
        d.ocupacoes,
        d.imoveis,
        d.inquilinos,
        d.pdf,
        d.storage,
      ),
      excluir: new Contratos.ExcluirContrato(d.contratos, d.storage),
    },
    financeiro: {
      listarCobrancas: new Financeiro.ListarCobrancas(fontesFinanceiro),
      registrarCobranca: new Financeiro.RegistrarCobrancaMensal(d.pagamentos, d.ocupacoes),
      editarCobranca: new Financeiro.EditarCobranca(d.pagamentos),
      gerarCobrancasDoMes: new Financeiro.GerarCobrancasDoMes(d.pagamentos, d.ocupacoes),
      registrarPagamento: new Financeiro.RegistrarPagamento(d.pagamentos),
      removerRecebimento: new Financeiro.RemoverRecebimento(d.pagamentos),
      excluirCobranca: new Financeiro.ExcluirCobranca(d.pagamentos),
      calcularSaldo: new Financeiro.CalcularSaldoDevedor(d.pagamentos),
    },
    relatorios: {
      compararPeriodos: new Relatorios.CompararPeriodosImovel(
        d.imoveis,
        d.ocupacoes,
        d.inquilinos,
        d.pagamentos,
      ),
      receitaMensal: new Relatorios.ObterReceitaMensal(d.pagamentos),
      indicadores: new Relatorios.ObterIndicadoresDashboard(
        d.imoveis,
        d.ocupacoes,
        d.inquilinos,
        d.pagamentos,
        d.contratos,
        d.leads,
      ),
    },
    auth: {
      autenticar: new Auth.AutenticarUsuario(d.usuarios, d.sessao),
      sessaoAtual: new Auth.ObterSessaoAtual(d.sessao),
      encerrarSessao: new Auth.EncerrarSessao(d.sessao),
    },
    portal: {
      autenticar: new Portal.AutenticarInquilino(
        d.inquilinos,
        d.credenciaisInquilinos,
        d.hashSenha,
        d.sessaoInquilino,
      ),
      sessaoAtual: new Portal.ObterSessaoInquilino(d.sessaoInquilino),
      encerrarSessao: new Portal.EncerrarSessaoInquilino(d.sessaoInquilino),
      alterarSenha: new Portal.AlterarSenhaInquilino(
        d.inquilinos,
        d.credenciaisInquilinos,
        d.hashSenha,
      ),
      redefinirSenha: new Portal.RedefinirSenhaInquilino(d.inquilinos, d.credenciaisInquilinos),
      consultarAcesso: new Portal.ConsultarAcessoPortal(d.credenciaisInquilinos),
      painel: new Portal.ObterPainelInquilino(
        d.inquilinos,
        d.ocupacoes,
        d.imoveis,
        d.contratos,
        d.pagamentos,
        d.credenciaisInquilinos,
      ),
    },
    leads: {
      registrar: new Leads.RegistrarLead(d.leads, d.imoveis, d.email),
      listar: new Leads.ListarLeads(d.leads),
      atualizarStatus: new Leads.AtualizarStatusLead(d.leads),
    },
  };
}

export type CasosDeUso = ReturnType<typeof criarCasosDeUso>;
