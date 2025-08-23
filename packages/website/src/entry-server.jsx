import ReactDOMServer from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import './index.css';

export function render(url, context) {
  return ReactDOMServer.renderToString(
    <HelmetProvider context={context}>
      <StaticRouter location={url} context={context}>
        <App />
      </StaticRouter>
    </HelmetProvider>
  );
}
