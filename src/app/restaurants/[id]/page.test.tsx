import { render, screen } from '@testing-library/react';
import Page from './page';

describe('[id]/page', () => {
  it('renders restaurant page without crashing', async () => {
    // mock params as required by Page
    const params = Promise.resolve({ id: 'test-id' });
    render(<Page params={params} />);
    // Example: check for a heading or restaurant name
    // expect(screen.getByText(/restaurant/i)).toBeInTheDocument();
  });
});
