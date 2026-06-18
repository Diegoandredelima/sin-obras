/**
 * main.jsx — Ponto de entrada da aplicação React
 *
 * Responsabilidade única: montar o componente raiz <App /> no elemento
 * #root do index.html. Todo o roteamento e providers ficam dentro de App.
 *
 * index.css é importado aqui para garantir que os estilos globais do
 * Tailwind e as custom utilities sejam carregados antes de qualquer componente.
 */
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Monta a aplicação React no div#root definido em public/index.html
createRoot(document.getElementById('root')).render(<App />)
