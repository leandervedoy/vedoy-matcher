import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import lanternBase from './vendor/lantern/base.css?url';
import lanternComponents from './vendor/lantern/components.css?url';
import matcherStyles from './matcher.css?url';

export const links = () => [{ rel: 'stylesheet', href: lanternBase }, { rel: 'stylesheet', href: lanternComponents }, { rel: 'stylesheet', href: matcherStyles }];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
