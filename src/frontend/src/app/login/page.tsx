'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ErrorApi, Usuario } from '@/lib/api';

/** US-01 — inicio de sesion. */
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await api.post<Usuario>('/auth/login', { email, contrasena });
      router.push('/panel');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ErrorApi
          ? err.message
          : 'No se pudo conectar con el servidor.',
      );
      setEnviando(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#faf7f2] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-400 text-2xl font-bold text-white shadow-sm">
            T
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">TimeFlow</h1>
            <p className="text-sm text-slate-500">
              Registro de jornada y actividad
            </p>
          </div>
        </div>

        <form
          onSubmit={enviar}
          className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
        >
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Correo
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="tu@correo.cl"
            className="mb-4 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Contrasena
          </label>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            placeholder="••••••••"
            className="mb-5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />

          {error && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
          >
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          Cuentas de demostracion<br />
          trabajador@timeflow.cl · admin@timeflow.cl<br />
          Clave: Timeflow2026!
        </p>
      </div>
    </main>
  );
}
