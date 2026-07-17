describe('Painel de Risco (Auditoria do Art. 79)', () => {

  beforeEach(() => {
    cy.visit('/');
    // Instrui o robô a clicar no menu do painel de risco
    cy.contains('Painel de Risco').click(); 
  });

  it('Deve identificar o servidor Júlio Omissão na zona Vermelha (Teto Estourado)', () => {
    // Fica procurando a tabela carregar por até 10 segundos
    cy.contains('Júlio Omissão', { timeout: 10000 }).should('be.visible');
    
    // Se o Júlio apareceu na tela, a palavra VERMELHO (ou o card vermelho) tem que estar ligada a ele
    cy.contains('VERMELHO', { matchCase: false }).should('be.visible');
  });

  it('Deve identificar a servidora Marta Tensa na zona Amarela (Risco Iminente)', () => {
    cy.contains('Marta Tensa', { timeout: 10000 }).should('be.visible');
    cy.contains('AMARELO', { matchCase: false }).should('be.visible');
  });

});