describe('DRep nav opens the list, list links back to overview (issue 232)', () => {
  it('routes desktop and mobile DReps nav entries to the list page', () => {
    cy.visit('/en');

    cy.get('header a[href="https://www.1694.io/en/dreps/list"]')
      .first()
      .should('be.visible')
      .and('contain.text', 'DReps');
  });

  it('shows a Learn about DReps CTA on the list heading row', () => {
    cy.visit('/en/dreps/list');

    cy.contains('h2', 'Available DReps')
      .should('be.visible')
      .parent('section')
      .within(() => {
        cy.get('a[href="https://www.1694.io/en/dreps"]')
          .should('be.visible')
          .and('contain.text', 'Learn about DReps');
      });
  });

  it('follows Learn about DReps back to the overview', () => {
    cy.visit('/en/dreps/list');

    cy.get('a[href="https://www.1694.io/en/dreps"]')
      .contains('Learn about DReps')
      .click();

    cy.url().should('include', '/en/dreps');
  });
});
