describe('Proposal detail honest error (227)', () => {
  it('shows honest empty state on upstream failure, never Invalid Date / NaN / undefined', () => {
    cy.intercept(
      { method: 'GET', url: '**/actions-proposals/20' },
      { statusCode: 503, body: { statusCode: 503, message: 'Proposal 20 unavailable' } },
    ).as('getProposal');
    cy.intercept(
      { method: 'GET', url: '**/actions-proposals/20/polls' },
      { statusCode: 503, body: { statusCode: 503, message: 'Poll unavailable' } },
    ).as('getPoll');

    cy.visit('/en/proposals/20');
    cy.wait('@getProposal');
    cy.wait('@getPoll');

    cy.contains('Proposal details are currently unavailable').should('be.visible');
    cy.get('body').should('not.contain.text', 'Invalid Date');
    cy.get('body').should('not.contain.text', 'NaN vote');
    cy.get('nav, [data-testid="breadcrumbs"]').should(
      'not.contain.text',
      'undefined',
    );
  });

  it('shows poll unavailable note when only the poll fails', () => {
    cy.intercept(
      { method: 'GET', url: '**/actions-proposals/20' },
      {
        statusCode: 200,
        body: {
          data: {
            attributes: {
              createdAt: '2025-04-30T08:12:57.000Z',
              updatedAt: '2025-05-01T08:12:57.000Z',
              is_active: true,
              prop_comments_number: 0,
              bd_proposal_detail: {
                data: { attributes: { proposal_name: 'Stubbed proposal' } },
              },
              creator: { data: { attributes: { govtool_username: '' } } },
            },
          },
        },
      },
    ).as('getProposalOk');
    cy.intercept(
      { method: 'GET', url: '**/actions-proposals/20/polls' },
      { statusCode: 503, body: { statusCode: 503, message: 'Poll unavailable' } },
    ).as('getPollFail');

    cy.visit('/en/proposals/20');
    cy.wait('@getProposalOk');
    cy.wait('@getPollFail');

    cy.contains('Stubbed proposal').should('be.visible');
    cy.contains('Poll results are currently unavailable').should('be.visible');
    cy.get('body').should('not.contain.text', 'Invalid Date');
    cy.get('body').should('not.contain.text', 'NaN');
    cy.get('nav, [data-testid="breadcrumbs"]').should(
      'not.contain.text',
      'undefined',
    );
  });
});
