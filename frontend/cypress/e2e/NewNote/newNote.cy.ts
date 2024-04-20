describe("Create new note if wallet is connected", () => {
  it("should create a new note and show a error if wallet aint connected after submitting", () => {
    // Load the page
    cy.visit("localhost:3000/en/dreps/workflow/notes/new");

    cy.get("[data-testid=post-title-input]")
      .type("Sample Title")
      .should("have.value", "Sample Title");
    cy.get("[data-testid=post-tag-input]")
      .type("sample tag")
      .should("have.value", "sample tag");

    // Type content into the editor
    cy.get('[data-testid="post-editor-input"]').type("This is a test note.");

    // Verify that the typed content appears in the editor
    cy.get('[data-testid="post-editor-input"]').should(
      "contain.text",
      "This is a test note."
    );

    const typedContent = "This is a test note.";

    // Type content into the editor
    cy.get('[data-testid="post-editor-input"]').type(typedContent);
    cy.get('input[value="everyone"]').click();
    cy.get('input[value="everyone"]').should("be.checked");

    cy.get("[data-testid=post-submit-button]").click();

    // Assert that the error is shown when the wallet is not connected
    cy.get("[data-testid=error-msg]").should("be.visible");
  });
});
