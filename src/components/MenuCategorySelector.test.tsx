import { render, screen } from '@testing-library/react';
import MenuCategorySelector from './MenuCategorySelector';

describe('MenuCategorySelector', () => {
  it('renders without crashing', () => {
    render(<MenuCategorySelector categories={['Main Menu', 'Drinks']} selectedCategory="Main Menu" onSelectCategory={() => {}} />);
    expect(screen.getByText('Main Menu')).toBeInTheDocument();
    expect(screen.getByText('Drinks')).toBeInTheDocument();
  });

  it('calls onSelectCategory when a category is clicked', () => {
    const mockSelect = jest.fn();
    render(<MenuCategorySelector categories={['Main Menu', 'Drinks']} selectedCategory="Main Menu" onSelectCategory={mockSelect} />);
    screen.getByText('Drinks').click();
    expect(mockSelect).toHaveBeenCalledWith('Drinks');
  });
});
