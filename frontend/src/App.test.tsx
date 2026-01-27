import { render, screen } from '@testing-library/react'
import App from './App'

test('renders Vite + React text', () => {
  render(<App />)
  expect(screen.getByText(/vite \+ react/i)).toBeInTheDocument()
})
