import 'mapbox-gl/dist/mapbox-gl.css';
import type { Metadata } from 'next';
import { Roboto_Flex as Roboto } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zarr Data Explorer',
  description: 'A web application for exploring Zarr data'
};

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto'
});
export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProd = process.env.NODE_ENV === 'production';
  return (
    <html lang="en">
      <head>
        <Script
          src={isProd ? '/zarr-vis/libs/windy.js' : '/libs/windy.js'}
          strategy="afterInteractive"
        />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className={`${roboto.variable}`}>
        <div className="m-0 p-0 h-[100%]">{children}</div>
      </body>
    </html>
  );
}
