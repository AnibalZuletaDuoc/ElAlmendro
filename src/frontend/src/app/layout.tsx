import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TimeFlow',
  description: 'Monitoreo y registro de actividad de trabajadores remotos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
