import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="icon" type="image/svg+xml" href="https://pub-e4f5b0a4105248f090453c5e81b8348f.r2.dev/img/favicon.svg" />
        <meta name="theme-color" content="#0B4D94" />
        <meta name="description" content="Programa de Evaluación Institucional (PEI) - Universidad Politécnica Territorial de Puerto Cabello (UPTPC)" />
      </Head>
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

