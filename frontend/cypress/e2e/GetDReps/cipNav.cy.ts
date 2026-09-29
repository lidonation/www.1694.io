describe('CIP top-nav entry', () => {
  for (const locale of ['en', 'de']) {
    it(`navigates to the CIP-1694 content without leaving ${locale}`, () => {
      cy.visit(`/${locale}/dreps`);
      cy.get('[data-testid=nav-cip-link]')
        .should('have.attr', 'href', `/${locale}`)
        .click();
      cy.location('pathname').should('eq', `/${locale}`);
      cy.contains('CIP 1694 - An On-Chain');
    });
  }
});
