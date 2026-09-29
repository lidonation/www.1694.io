describe('Proposal detail honest error (227)', () => {
  const proposalUrl = '**/actions-proposals/20';
  const pollUrl = '**/actions-proposals/20/polls';
  const commentsUrl = '**/actions-proposals/20/comments';

  const assertNoBrokenValues = () => {
    cy.get('body')
      .should('not.contain.text', 'Invalid Date')
      .and('not.contain.text', 'NaN');
    // Next.js flight-data scripts contain `$undefined`; only rendered
    // navigation text must be free of the broken proposal label.
    cy.get('nav, [data-testid="breadcrumbs"]').should(
      'not.contain.text',
      'undefined',
    );
  };

  beforeEach(() => {
    cy.intercept({ method: 'GET', url: commentsUrl }, { data: [] }).as(
      'getComments',
    );
  });

  it('shows honest empty state on upstream failure, never Invalid Date / NaN / undefined', () => {
    cy.intercept(
      { method: 'GET', url: proposalUrl },
      {
        statusCode: 503,
        body: { statusCode: 503, message: 'Proposal 20 unavailable' },
      },
    ).as('getProposal');
    cy.intercept(
      { method: 'GET', url: pollUrl },
      {
        statusCode: 503,
        body: { statusCode: 503, message: 'Poll unavailable' },
      },
    ).as('getPoll');

    cy.visit('/en/proposals/20');
    cy.wait('@getProposal');
    cy.wait('@getPoll');

    cy.contains('Proposal details are currently unavailable').should(
      'be.visible',
    );
    assertNoBrokenValues();
  });

  it('shows poll unavailable note when only the poll fails', () => {
    cy.intercept(
      { method: 'GET', url: proposalUrl },
      {
        statusCode: 200,
        body: {
          data: {
            id: 20,
            attributes: {
              master_id: 20,
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
      { method: 'GET', url: pollUrl },
      {
        statusCode: 503,
        body: { statusCode: 503, message: 'Poll unavailable' },
      },
    ).as('getPollFail');

    cy.visit('/en/proposals/20');
    cy.wait('@getProposalOk');
    cy.wait('@getPollFail');
    cy.wait('@getComments');

    cy.contains('Stubbed proposal').should('be.visible');
    cy.contains('Poll results are currently unavailable').should('be.visible');
    assertNoBrokenValues();
  });
});
