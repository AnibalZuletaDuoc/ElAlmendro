/** Etiqueta breve de estado. `clase` trae el color, como en el mapa ESTADOS. */
export default function Insignia({
  clase,
  children,
}: {
  clase: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${clase}`}
    >
      {children}
    </span>
  );
}
