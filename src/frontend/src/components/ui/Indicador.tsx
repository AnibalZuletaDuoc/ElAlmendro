/** Cifra destacada de una fila de indicadores. */
export default function Indicador({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="font-mono text-lg font-semibold leading-tight text-slate-800">{valor}</p>
      {detalle && <p className="text-[11px] text-slate-400">{detalle}</p>}
    </div>
  );
}
