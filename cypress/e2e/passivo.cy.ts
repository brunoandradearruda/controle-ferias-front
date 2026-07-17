describe('Módulo de Passivo (Férias Acumuladas)', () => {

  beforeEach(() => {
    cy.visit('/');
    cy.contains('Quadro de Lotação').click(); // Navega pelo menu
    cy.contains('Gerencie a base de servidores', { timeout: 10000 }).should('be.visible');
    cy.get('button[title="Adicionar Férias Acumuladas (Passivo)"]', { timeout: 10000 }).should('exist');
  });

  it('Deve abrir o modal de Passivo ao clicar no botão laranja', () => {
    cy.get('button[title="Adicionar Férias Acumuladas (Passivo)"]').first().click();
    
    // Valida se os textos principais do modal carregaram
    cy.contains('Registrar Férias Pendentes').should('be.visible');
    cy.contains('Selecione os Períodos Pendentes').should('be.visible');
  });

  it('Deve manter o botão "Confirmar Inclusão" desabilitado se nenhum período for selecionado', () => {
    cy.get('button[title="Adicionar Férias Acumuladas (Passivo)"]').first().click();
    
    // O botão deve nascer desabilitado (disabled) para evitar envio de array vazio para o Java
    cy.contains('button', 'Confirmar Inclusão').should('be.disabled');
  });

});