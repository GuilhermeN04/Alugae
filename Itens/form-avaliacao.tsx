import { useState } from "react";

export function FormAvaliacao({
  titulo,
  pendente,
  onEnviar,
  comItem,
}: {
  titulo: string;
  pendente: boolean;
  comItem?: boolean;
  onEnviar: (nota: number, comentario: string, notaItem: number | null) => void;
}) {
  const [nota, setNota] = useState(5);
  const [notaItem, setNotaItem] = useState(5);
  const [comentario, setComentario] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onEnviar(nota, comentario, comItem ? notaItem : null);
      }}
      className="mt-4 space-y-3 rounded-2xl border border-border p-4"
    >
      <p className="text-sm font-medium">{titulo}</p>
      <Estrelas rotulo={comItem ? "Nota para o anunciante" : "Nota para a pessoa"} valor={nota} onChange={setNota} />
      {comItem ? <Estrelas rotulo="Nota para o item" valor={notaItem} onChange={setNotaItem} /> : null}
      <label className="block text-xs text-muted-foreground">
        Comentário
        <textarea
          rows={2}
          className="field mt-1"
          placeholder="Como foi a retirada e a devolução?"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={pendente}
        className="rounded-xl bg-brand px-4 py-2 text-xs font-medium text-primary-foreground shadow-brand disabled:opacity-60"
      >
        Enviar avaliação
      </button>
    </form>
  );
}

function Estrelas({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (n: number) => void }) {
  return (
    <div className="text-xs text-muted-foreground">
      {rotulo}
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label={rotulo}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} de 5`}
            onClick={() => onChange(n)}
            className={`text-2xl leading-none ${n <= valor ? "text-brand" : "text-muted-foreground/40"}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
