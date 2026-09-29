describe('CIP top-nav entry', () => {
  it('navigates from the DReps page to the CIP-1694 content', () => {
    cy.visit('en/dreps');
    cy.get('[data-testid=nav-cip-link]').click();
    cy.contains('CIP 1694 - An On-Chain');
  });
});
