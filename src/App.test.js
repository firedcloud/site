import { render, screen } from '@testing-library/react';
import App from './App';

test('Render the site', () => {
  render(<App />);
  const linkElement = screen.getByText(/FireCloud/i);
  expect(linkElement).toBeInTheDocument();
});
