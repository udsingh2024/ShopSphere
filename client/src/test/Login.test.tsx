import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Login from '../pages/Auth/Login';
import { renderWithProviders } from './testUtils';
import userEvent from '@testing-library/user-event';

describe('Login Component', () => {
  test('renders login form items', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('displays validation messages for empty inputs on submit', async () => {
    renderWithProviders(<Login />);
    
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('shows invalid email address warning', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/name@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.type(passwordInput, 'somepassword');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });
});
