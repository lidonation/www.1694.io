describe('CIP-1694 governance content', () => {
  it('shows the ratified Constitution and implemented governance milestones', () => {
    cy.visit('/en');

    cy.get('#the-cardano-constitution')
      .should('be.visible')
      .and('contain.text', 'ratified on-chain in February 2025')
      .and('contain.text', 'amended in January 2026')
      .and('not.contain.text', 'informational document')
      .and('not.contain.text', 'not yet defined');

    cy.get('#guardrails-script')
      .should('be.visible')
      .and(
        'contain.text',
        'optional guardrails script can also enforce on-chain constraints',
      )
      .and('not.contain.text', 'informal, off-chain document');

    cy.contains('p', 'Governance implementation (2024-2026)')
      .should('be.visible')
      .parent()
      .should('contain.text', 'Chang hard fork in September 2024')
      .and('contain.text', 'Plomin hard fork in January 2025')
      .and('contain.text', 'amended in January 2026');
  });
});
