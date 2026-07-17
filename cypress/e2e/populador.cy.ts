describe('População de Dados em Massa (Data Seeding)', () => {

  it('Deve injetar 50 servidores variados diretamente na API do Spring Boot', () => {
    
    const cargos = ['Auditor', 'Técnico', 'Analista', 'Assessor'];
    const lotacoes = ['SEPLAG', 'Saúde', 'Educação', 'Gabinete'];

    for (let i = 1; i <= 50; i++) {
      // Sorteia dados aleatórios
      const cargoSorteado = cargos[Math.floor(Math.random() * cargos.length)];
      const lotacaoSorteada = lotacoes[Math.floor(Math.random() * lotacoes.length)];
      const admissaoAleatoria = `202${Math.floor(Math.random() * 5)}-05-10`; // Anos entre 2020 e 2024

      // Dispara a requisição direto para o seu Back-end em milissegundos
      cy.request({
        method: 'POST',
        // ATENÇÃO: Coloque aqui a porta correta do seu Spring Boot (ex: 8080)
        url: 'http://localhost:8080/api/v1/servidores', 
        body: {
          nome: `Servidor Automação Cypress ${i}`,
          matricula: `CYP-${1000 + i}`,
          cargo: cargoSorteado,
          lotacao: lotacaoSorteada,
          ativo: true,
          dataAdmissao: admissaoAleatoria
        }
      }).then((response) => {
        // Valida se o Java aceitou e criou com sucesso (Status 201 Created)
        expect(response.status).to.eq(201);
      });
    }
  });

});