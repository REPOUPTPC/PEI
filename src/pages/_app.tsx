import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';
import { ToastProvider } from '@/components/Toast';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Head>
        <title>PEI - Programa de Evaluación Institucional | UPTPC</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
    </ToastProvider>
  );
}
