import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="dark bg-base-100 h-[100vh]">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
