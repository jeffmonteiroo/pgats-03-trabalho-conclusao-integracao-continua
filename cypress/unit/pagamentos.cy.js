import {
  classificarValor,
  criarPagamento,
  ServicoDePagamento
} from '../../src/servicoDePagamento.js';
import { converterValor } from '../../src/valorDoFormulario.js';

describe('Unitários puros no runner Cypress (sem montar componentes)', () => {
  for (const [valor, categoria] of [
    [99.99, 'padrão'],
    [100, 'padrão'],
    [100.01, 'cara']
  ]) {
    it(`classifica o valor de fronteira ${valor}`, () => {
      expect(classificarValor(valor)).to.equal(categoria);
    });
  }
  it('rejeita dados inválidos diretamente na função de domínio', () => {
    expect(() => criarPagamento('', 'Empresa Exemplo', 10)).to.throw(TypeError);
    expect(() => criarPagamento('DEMO', 'Empresa Exemplo', 0)).to.throw(TypeError);
    expect(() => criarPagamento('DEMO', 'Empresa Exemplo', 100.001)).to.throw(TypeError);
  });
  it('converte valores com vírgula sem aceitar texto misturado', () => {
    expect(converterValor('100,01')).to.equal(100.01);
    expect(converterValor('100abc')).to.be.NaN;
  });
  it('consulta o último pagamento sem UI, API ou armazenamento', () => {
    const servico = new ServicoDePagamento();
    expect(servico.consultarUltimoPagamento()).to.be.undefined;
    servico.pagar('DEMO-A', 'Empresa A', 99.99);
    servico.pagar('DEMO-B', 'Empresa B', 100.01);
    expect(servico.consultarUltimoPagamento()).to.deep.equal({
      codigoBarras: 'DEMO-B',
      empresa: 'Empresa B',
      valor: 100.01,
      categoria: 'cara'
    });
  });
});
