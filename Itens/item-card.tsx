import { Link } from "@tanstack/react-router";
import { moeda, type ItemComRelacoes } from "@/lib/alugae";

export function ItemCard({ item }: { item: ItemComRelacoes }) {
  const locador = item.profiles?.nome ?? "Locador";
  return (
    <Link
      to="/item/$itemId"
      params={{ itemId: item.id }}
      className="glass group block rounded-3xl p-3 transition-transform hover:-translate-y-0.5"
    >
      <div className="relative overflow-hidden rounded-2xl">
        {item.imagem_url ? (
          <img
            src={item.imagem_url}
            alt={item.titulo}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="grid aspect-[4/3] w-full place-items-center bg-clay/15 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            sem foto
          </div>
        )}
        {item.categorias?.nome ? (
          <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-wood backdrop-blur">
            {item.categorias.nome}
          </span>
        ) : null}
      </div>
      <div className="px-1.5 pt-3">
        <h3 className="text-balance text-[15px] font-semibold leading-tight">{item.titulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {[item.bairro, item.cidade].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
          <div>
            <span className="text-lg font-semibold tracking-tight">{moeda(item.preco_dia)}</span>
            <span className="text-sm text-muted-foreground">/dia</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-brand-wood">
            <span className="grid size-5 place-items-center rounded-full bg-brand/15 text-[10px] font-semibold">
              {locador.charAt(0).toUpperCase()}
            </span>
            {locador}
          </span>
        </div>
      </div>
    </Link>
  );
}
