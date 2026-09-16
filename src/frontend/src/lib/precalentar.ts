/**
 * Solo en desarrollo. Turbopack compila cada ruta la primera vez que alguien
 * la pide, y esa primera visita tarda varios segundos. Aqui se piden en
 * segundo plano, de a una y cuando el navegador esta ocioso, las rutas del
 * menu que aun no se han visitado: cuando el usuario haga clic, ya estaran
 * compiladas. En produccion no hace falta (las rutas vienen compiladas y
 * <Link> ya las precarga), asi que no hace nada.
 */
const pedidas = new Set<string>();

export function precalentarRutas(rutas: string[]) {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;
  const pendientes = rutas.filter((r) => !pedidas.has(r));
  if (pendientes.length === 0) return;
  pendientes.forEach((r) => pedidas.add(r));

  const correr = async () => {
    for (const ruta of pendientes) {
      try {
        // Cabecera RSC: mismo tipo de peticion que hace el router al navegar.
        await fetch(ruta, { headers: { RSC: '1' }, credentials: 'include' });
      } catch {
        /* sin red o ruta caida: no importa, es solo precalentamiento */
      }
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => void correr(), { timeout: 4000 });
  } else {
    setTimeout(() => void correr(), 2000);
  }
}
