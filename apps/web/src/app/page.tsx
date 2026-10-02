export default function HomePage() {
  return (
    <main>
      <h1>Planejador BNCC</h1>
      <p>Ambiente web inicial. A experiência do professor será implementada na Fase C.</p>
      <p>API configurada em {process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1'}.</p>
    </main>
  );
}
