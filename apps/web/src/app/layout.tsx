import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planejador BNCC',
  description: 'Planejador de aulas alinhado à BNCC.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
