import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Le dice a Next.js dónde está tu app para cargar los archivos .env y next.config.js
  dir: './',
})
 
// Configuración personalizada de Jest
/** @type {import('jest').Config} */
const config = {
  // Añade más carpetas aquí si quieres que el coverage mida más sitios
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!<rootDir>/.next/**',
    '!<rootDir>/*.config.js',
    '!<rootDir>/coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  
  // Esto simula un navegador real para poder testear el DOM de React
  testEnvironment: 'jest-environment-jsdom',
}
 
export default createJestConfig(config)
