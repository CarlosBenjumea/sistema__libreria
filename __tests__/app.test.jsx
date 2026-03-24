import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importamos los componentes (Ajusta las rutas según tu estructura de carpetas)
import BooksPage from '@/app/books/page';
import SocialPage from '@/app/social/page';
import TusLibrosPage from '@/app/tus-libros/page';
import UsersPage from '@/app/users/page';

// 1. Mock de dependencias externas
// Mock de next/image para evitar errores de renderizado en Jest
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} priority="true" />;
  },
}));

// Mock del cliente de usuario activo usado en TusLibrosPage
jest.mock('@/lib/active-user-client', () => ({
  getActiveUserIdFromStorage: jest.fn(() => '1'),
  subscribeActiveUserChanges: jest.fn(() => jest.fn()), // devuelve función de unsubscribe
  notifyUsersUpdated: jest.fn(),
}));

// Mock de `confirm` del navegador (usado en los botones de borrar)
global.confirm = jest.fn(() => true);

// 2. Mock global de fetch
global.fetch = jest.fn();

describe('Tests de la Aplicación de Gestión de Biblioteca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- TESTS PARA BOOKS PAGE ---
  describe('BooksPage Component', () => {
    it('debe renderizar el título de la página y cargar los libros', async () => {
      // Configuramos el mock de fetch para devolver un libro de prueba
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: '1984', author: 'George Orwell', total_copies: 5, available_copies: 5 }],
      });

      render(<BooksPage />);

      // Verifica que el título y el estado de carga inicial existen
      expect(screen.getByText('Books Inventory')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Espera a que el fetch se complete y el libro aparezca en pantalla
      await waitFor(() => {
        expect(screen.getByText('1984')).toBeInTheDocument();
        expect(screen.getByText('George Orwell')).toBeInTheDocument();
      });
    });

    it('debe abrir el formulario al hacer clic en "Add New Book"', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      
      render(<BooksPage />);
      
      const addButton = screen.getByText('Add New Book');
      fireEvent.click(addButton);

      // El formulario debería aparecer
      expect(screen.getByPlaceholderText('e.g. 1984')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  // --- TESTS PARA SOCIAL PAGE ---
  describe('SocialPage Component', () => {
    it('debe mostrar mensaje cuando no hay reseñas', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<SocialPage />);

      await waitFor(() => {
        expect(screen.getByText('Aún no hay reseñas compartidas.')).toBeInTheDocument();
      });
    });

    it('debe mostrar las reseñas compartidas', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 1,
          book_title: 'Dune',
          book_author: 'Frank Herbert',
          shared_by_name: 'Juan',
          shared_by_email: 'juan@test.com',
          comment: 'Increíble libro de ciencia ficción.',
          rating: 5
        }],
      });

      render(<SocialPage />);

      await waitFor(() => {
        expect(screen.getByText('Dune')).toBeInTheDocument();
        expect(screen.getByText('Frank Herbert')).toBeInTheDocument();
        expect(screen.getByText(/Juan/)).toBeInTheDocument();
        expect(screen.getByText('Increíble libro de ciencia ficción.')).toBeInTheDocument();
      });
    });
  });

  // --- TESTS PARA TUS LIBROS PAGE ---
  describe('TusLibrosPage Component', () => {
    it('debe renderizar correctamente y cargar libros reservados del usuario activo', async () => {
      // Mock para fetchUsers
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name: 'Juan Perez', email: 'juan@test.com' }],
      });
      // Mock para fetchReservedBooks
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ eligibleBooks: [{ id: 10, title: 'Fahrenheit 451', author: 'Ray Bradbury' }] }),
      });
      // Mock para fetchLoanHistory
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TusLibrosPage />);

      await waitFor(() => {
        // Debería detectar al usuario mockeado
        expect(screen.getByText('Fahrenheit 451')).toBeInTheDocument();
      });
    });
  });

  // --- TESTS PARA USERS PAGE ---
  describe('UsersPage Component', () => {
    it('debe cargar la lista de usuarios', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{
          id: 1,
          name: 'Ana Garcia',
          email: 'ana@ejemplo.com',
          phone: '123456789',
          registered_date: '2023-01-01'
        }],
      });

      render(<UsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Ana Garcia')).toBeInTheDocument();
        expect(screen.getByText('ana@ejemplo.com')).toBeInTheDocument();
      });
    });

    it('permite escribir en el formulario de nuevo usuario', async () => {
      fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      
      render(<UsersPage />);
      
      const addButton = screen.getByText('Add New User');
      fireEvent.click(addButton);

      const nameInput = screen.getByPlaceholderText('e.g. John Doe');
      fireEvent.change(nameInput, { target: { value: 'Pedro Gomez' } });
      
      expect(nameInput.value).toBe('Pedro Gomez');
    });
  });
});
