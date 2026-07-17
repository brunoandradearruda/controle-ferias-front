describe('Módulo de Dossiê Histórico', () => {

  beforeEach(() => {
    cy.visit('/');
    cy.contains('Quadro de Lotação').click();
    cy.contains('Gerencie a base de servidores', { timeout: 10000 }).should('be.visible');
    cy.get('button[title="Ver Dossiê Histórico Completo"]', { timeout: 10000 }).should('exist');
  });

  it('Deve abrir o Dossiê do servidor com sucesso', () => {
    cy.get('button[title="Ver Dossiê Histórico Completo"]').first().click();
    
    // Aqui usamos matchCase: false para achar a palavra "Dossiê" não importando como foi digitada
    cy.contains('Dossiê', { matchCase: false, timeout: 5000 }).should('be.visible');
  });

});