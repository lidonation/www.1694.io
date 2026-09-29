describe('DRep nav opens the list, list links back to overview (issue 232)', () => {
  it('routes the desktop DReps nav entry to the list page', () => {
    cy.visit('/en/dreps');

    cy.get('header [data-testid="nav-dreps-link"]')
      .should('be.visible')
      .and('contain.text', 'DReps')
      .and('have.attr', 'href', '/en/dreps/list');
    cy.get('header [data-testid="nav-dreps-link"]').click();

    cy.location('pathname').should('eq', '/en/dreps/list');
  });

  it('routes the mobile DReps nav entry to the list page', () => {
    cy.viewport('iphone-x');
    cy.visit('/en/dreps');

    cy.get('header img[alt="Drawer"]').should('be.visible').click();
    cy.get('[data-testid="nav-dreps-link"]')
      .should('be.visible')
      .and('have.attr', 'href', '/en/dreps/list');
    cy.get('[data-testid="nav-dreps-link"]').click();

    cy.location('pathname').should('eq', '/en/dreps/list');
  });

  it('shows a Learn about DReps CTA on the list heading row', () => {
    cy.visit('/en/dreps/list');

    cy.contains('h2', 'Available DReps')
      .should('be.visible')
      .parent('section')
      .within(() => {
        cy.get('a[href="/en/dreps"]')
          .should('be.visible')
          .and('contain.text', 'Learn about DReps');
      });
  });

  it('follows Learn about DReps back to the overview', () => {
    cy.visit('/en/dreps/list');

    cy.contains('a', 'Learn about DReps').click();

    cy.location('pathname').should('eq', '/en/dreps');
  });
});
