import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from '../NotFound';

describe('NotFound', () => {
  it('should render 404 heading', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should display not found message', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('should have link to login', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    const loginLink = screen.getByText('Go to Login');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should have links to student and teacher apps', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText('Student App')).toBeInTheDocument();
    expect(screen.getByText('Teacher App')).toBeInTheDocument();
  });
});
