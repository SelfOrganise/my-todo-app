import { Html, Head, Main, NextScript } from 'next/document';

const dev = `
window.OneSignal = window.OneSignal || [];
  OneSignal.push(function() {
    OneSignal.init({
      appId: "7157dd4c-e740-4aba-9c5e-a63bedc6f1fa",
      safari_web_id: "web.onesignal.auto.34975c41-96f8-43c9-89c6-048b8e5234aa",
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });
  });
`;

const prod = `
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(function() {
    OneSignal.init({
      appId: "03cf5b65-ca13-456d-af8e-393d5d28b4b1",
      safari_web_id: "web.onesignal.auto.5f176c09-6482-49c9-87ea-0c57aa3981a0",
      notifyButton: {
        enable: true,
      },
      subdomainName: "todo-3pounds",
    });
  });
`;

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.onesignal.com/sdks/OneSignalSDK.js" async />
        <script
          dangerouslySetInnerHTML={{
            __html: process.env.NODE_ENV != 'production' ? dev : prod,
          }}
        ></script>
      </Head>
      <body className="dark bg-gray-800 h-[100vh]">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
