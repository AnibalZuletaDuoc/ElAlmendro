export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold">TimeFlow</h1>
      <p className="text-slate-600">
        Base del proyecto levantada. Las pantallas se construyen sobre esta capa
        de interfaz; el inicio de sesion corresponde a la historia US-01.
      </p>
      <a
        className="text-sm text-blue-700 underline"
        href={`${process.env.API_URL}/api/salud`}
      >
        Verificar estado de la API
      </a>
    </main>
  );
}
