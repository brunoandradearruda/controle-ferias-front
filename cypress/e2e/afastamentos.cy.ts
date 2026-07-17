describe('Módulo de Afastamentos Legais', () => {

  beforeEach(() => {
    // 1. Entra na página inicial do seu sistema
    cy.visit('/');

    // 2. IMPORTANTE: Ensina o robô a navegar! 
    // Substitua 'Quadro de Lotação' pelo texto exato que está no seu MENU LATERAL.
    // (Se o seu sistema já abre direto no Quadro de Lotação sem precisar clicar em menu, apague esta linha)
    cy.contains('Quadro de Lotação').click();

    // 3. Verifica se a tela certa realmente abriu antes de procurar botões
    cy.contains('Gerencie a base de servidores', { timeout: 10000 }).should('be.visible');
    
    // 4. Agora sim, garante que a tabela renderizou o botão roxo
    cy.get('button[title="Registrar Afastamento ou Suspensão"]', { timeout: 10000 }).should('exist');
  });

  it('Deve abrir o modal de afastamento ao clicar no botão roxo', () => {
    cy.get('button[title="Registrar Afastamento ou Suspensão"]').first().click();
    cy.contains('Registrar Afastamento').should('be.visible');
    cy.contains('Tipo Legal do Afastamento').should('be.visible');
  });

  it('Deve bloquear tentativa de salvar com Data de Início MAIOR que a Data Fim', () => {
    cy.get('button[title="Registrar Afastamento ou Suspensão"]').first().click();

    cy.get('select').select('LICENCA_SEM_VENCIMENTO');
    cy.get('input[type="date"]').eq(0).type('2026-12-01'); 
    cy.get('input[type="date"]').eq(1).type('2026-10-01'); 

    const alertStub = cy.stub();
    cy.on('window:alert', alertStub);

    cy.contains('Aplicar Suspensão').click().then(() => {
      expect(alertStub.getCall(0)).to.be.calledWithMatch(/A Data de Início não pode ser maior que a Data Fim/);
    });
  });

});