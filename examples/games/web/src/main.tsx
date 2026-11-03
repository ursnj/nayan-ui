import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ExamplePage } from './ExamplePage';
import { Home } from './Home';
import './style.css';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/:id', element: <ExamplePage /> }
]);

createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
