import { render, screen } from '@testing-library/react';
import App from './App';

test('renders region selector', () => {
  render(<App />);
  const regionHeading = screen.getByText(/What region are you in/i);
  expect(regionHeading).toBeInTheDocument();
});
