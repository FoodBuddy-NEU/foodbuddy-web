// E2E: 关键用户流程 - 浏览餐厅列表、详情、提交反馈

describe('FoodBuddy E2E - Restaurant User Flow', () => {
  it('should load home page and show restaurant list', () => {
    cy.visit('/');
    cy.contains('Search').should('exist');
    cy.get('[data-testid="restaurant-card"]').should('exist');
  });

  it('should navigate to restaurant detail page', () => {
    cy.visit('/');
    cy.get('[data-testid="restaurant-card"]').first().click();
    cy.url().should('include', '/restaurants/');
    cy.contains('Menu').should('exist');
    cy.contains('Deals').should('exist');
  });

  it('should submit feedback on restaurant detail page', () => {
    cy.visit('/restaurants/r1');
    cy.get('[data-testid="feedback-form"]').within(() => {
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('textarea[name="content"]').type('Great food!');
      cy.get('button[type="submit"]').click();
    });
    cy.contains('Thank you').should('exist');
  });
});
