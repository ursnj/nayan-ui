import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { GamePage } from './GamePage';
import { Home } from './Home';
import './style.css';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/:id', element: <GamePage /> }
]);

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
