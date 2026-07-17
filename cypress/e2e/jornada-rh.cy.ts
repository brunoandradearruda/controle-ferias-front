describe('Jornada Completa do RH: Um Dia de Trabalho no Sistema', () => {

  // Antes de começar o dia de trabalho, o RH abre o sistema
  before(() => {
    cy.visit('/');
  });

  it('O RH realiza todas as tarefas diárias de gestão de férias', () => {
    
    // =======================================================================
    // TAREFA 1: Acessar o sistema e verificar quem está estourando o prazo
    // =======================================================================
    cy.log('TAREFA 1: Checagem do Painel de Risco (Art. 79)');
    
    cy.contains('Painel de Risco').click();
    cy.contains('Auditoria Estatutária', { timeout: 10000 }).should('be.visible');
    
    // O RH confere se existe alguém na zona vermelha e anota o nome para notificar
    cy.get('body').then(($body) => {
      if ($body.text().includes('VERMELHO')) {
        cy.log('Alerta: Existem servidores com prazo fatal estourado!');
      }
    });

    // =======================================================================
    // TAREFA 2: Navegar para o Quadro de Lotação
    // =======================================================================
    cy.log('TAREFA 2: Acessar a base de servidores');
    
    cy.contains('Quadro de Lotação').click();
    cy.contains('Gerencie a base de servidores', { timeout: 10000 }).should('be.visible');

    // =======================================================================
    // TAREFA 3: Analisar o Dossiê de um servidor específico
    // =======================================================================
    cy.log('TAREFA 3: Consultar Dossiê Histórico');
    
    // Clica no primeiro botão de Dossiê da lista
    cy.get('button[title="Ver Dossiê Histórico Completo"]').first().click();
    
    // O RH lê a tela do dossiê
    cy.contains('Dossiê', { matchCase: false, timeout: 5000 }).should('be.visible');
    cy.contains('Linha do Tempo').should('be.visible');
    
    // O RH fecha o Dossiê para ir para a próxima tarefa
    cy.get('button').contains('Fechar').click(); // Ajuste o seletor do botão fechar se necessário

    // =======================================================================
    // TAREFA 4: Registrar um Afastamento Legal (Suspensão)
    // =======================================================================
    cy.log('TAREFA 4: Registrar Licença Sem Vencimento');
    
    cy.get('button[title="Registrar Afastamento ou Suspensão"]').first().click();
    cy.contains('Registrar Afastamento').should('be.visible');
    
    // O RH preenche a papelada digital
    cy.get('select').select('LICENCA_SEM_VENCIMENTO');
    cy.get('input[type="date"]').eq(0).type('2026-08-01'); 
    cy.get('input[type="date"]').eq(1).type('2026-08-30'); 
    
    // Prepara para capturar o "alert" de sucesso do navegador
    cy.on('window:alert', (texto) => {
      expect(texto).to.contains('sucesso');
    });
    
    // Confirma a operação
    cy.contains('Aplicar Suspensão').click();

    // =======================================================================
    // TAREFA 5: Processar Férias Atrasadas (Passivo)
    // =======================================================================
    cy.log('TAREFA 5: Lançamento de Passivo em Lote');
    
    // Pega o segundo servidor da lista (eq(1) significa o índice 1 do array)
    cy.get('button[title="Adicionar Férias Acumuladas (Passivo)"]').eq(1).click();
    cy.contains('Registrar Férias Pendentes').should('be.visible');
    
    // O RH tenta selecionar um período atrasado (clica no primeiro botão de ano disponível)
    // Ignoramos o clique se todos os botões estiverem desabilitados (já cadastrados)
    cy.get('.grid button').first().then(($btn) => {
      if (!$btn.is(':disabled')) {
        cy.wrap($btn).click();
        cy.contains('Confirmar Inclusão').click();
      } else {
        // Se já tiver cadastrado, o RH apenas cancela e fecha o modal
        cy.contains('Cancelar').click();
      }
    });

    // =======================================================================
    // TAREFA 6: Desligamento de Servidor (Aposentadoria)
    // =======================================================================
    cy.log('TAREFA 6: Inativar Servidor');
    
    // "Moka" (Finge) o window.prompt para preencher o motivo do desligamento automaticamente
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('Aposentadoria Compulsória - Diário Oficial');
    });

    // Clica no botão de desligar do terceiro servidor da lista
    cy.get('button[title="Desligar Servidor"]').eq(2).click();

    // =======================================================================
    // FIM DO EXPEDIENTE
    // =======================================================================
    cy.log('Fim da Jornada: Todas as funções essenciais operaram sem falhas.');
  });

});