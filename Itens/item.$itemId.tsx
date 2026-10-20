import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { diasEntre, estrelas, listarAvaliacoesItem, obterReputacao, obterReputacaoItem, listarFotos, moeda, obterItem, periodosBloqueados, periodosOcupados } from "@/lib/alugae";
import { CalendarioDisponibilidade } from "@/components/calendario-disponibilidade";

export const Route = createFileRoute("/item/$itemId")({
  head: () => ({
    meta: [
      { title: "Item para alugar — Alugaê" },
      {
        name: "description",
        content: "Veja fotos, preço por dia, condições de uso e reserve o período no Alugaê.",
      },
      { property: "og:title", content: "Item para alugar — Alugaê" },
      {
        property: "og:description",
        content: "Detalhes do item, disponibilidade e solicitação de reserva.",
      },
    ],
  }),
  component: ItemDetalhe,
});

function ItemDetalhe() {
  const { itemId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const item = useQuery({ queryKey: ["item", itemId], queryFn: () => obterItem(itemId) });
  const ocupados = useQuery({
    queryKey: ["ocupados", itemId],
    queryFn: () => periodosOcupados(itemId),
  });

  const bloqueados = useQuery({
    queryKey: ["bloqueados", itemId],
    queryFn: () => periodosBloqueados(itemId),
  });

  const fotos = useQuery({
    queryKey: ["fotos", itemId],
    queryFn: () => listarFotos(itemId, item.data?.imagem_url),
    enabled: item.isSuccess,
  });
  const [fotoAtiva, setFotoAtiva] = useState(0);

  const dias = diasEntre(inicio, fim);
  const repItem = useQuery({ queryKey: ["reputacao-item", itemId], queryFn: () => obterReputacaoItem(itemId) });
  const avalItem = useQuery({ queryKey: ["avaliacoes-item", itemId], queryFn: () => listarAvaliacoesItem(itemId) });
  const locadorId = item.data?.locador_id;
  const repLocador = useQuery({
    queryKey: ["reputacao", locadorId],
    queryFn: () => obterReputacao(locadorId!),
    enabled: !!locadorId,
  });
  const total = dias * (item.data?.preco_dia ?? 0);

  const reservar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Entre na sua conta para reservar.");
      const dados = item.data;
      if (!dados) throw new Error("Item não encontrado.");
      if (dados.locador_id === user.id) throw new Error("Você não pode alugar seu próprio item.");
      if (dias <= 0) throw new Error("Escolha um período válido.");
      const conflito = (ocupados.data ?? []).some(
        (r) => inicio <= r.data_fim && fim >= r.data_inicio,
      );
      if (conflito) throw new Error("Esse período já está reservado para este item.");
      const indisponivel = (bloqueados.data ?? []).some(
        (r) => inicio <= r.data_fim && fim >= r.data_inicio,
      );
      if (indisponivel) throw new Error("O dono marcou dias desse período como indisponíveis.");

      const { data, error } = await supabase
        .from("reservas")
        .insert({
          item_id: dados.id,
          locatario_id: user.id,
          locador_id: dados.locador_id,
          data_inicio: inicio,
          data_fim: fim,
          valor_total: total,
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("pagamentos").insert({ reserva_id: data.id, valor: total });
      return data.id;
    },
    onSuccess: () => navigate({ to: "/reservas" }),
    onError: (e) => setErro(e instanceof Error ? e.message : "Não foi possível reservar."),
  });

  if (item.isLoading) {
    return <main className="mx-auto max-w-6xl px-5 py-16 text-sm text-muted-foreground">Carregando…</main>;
  }

  if (!item.data) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm text-muted-foreground">Este item não está disponível.</p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand-wood underline">
          Voltar para a busca
        </Link>
      </main>
    );
  }

  const dados = item.data;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="glass-strong rounded-3xl p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-brand/15 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-wood">
              Detalhe do item
            </span>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Voltar
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl">
            {(fotos.data ?? []).length ? (
              <img
                src={(fotos.data ?? [])[Math.min(fotoAtiva, (fotos.data ?? []).length - 1)]}
                alt={dados.titulo}
                width={1280}
                height={800}
                className="aspect-[16/10] w-full object-cover"
              />
            ) : (
              <div className="grid aspect-[16/10] w-full place-items-center bg-clay/15 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                sem foto
              </div>
            )}
          </div>
          {(fotos.data ?? []).length > 1 ? (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {(fotos.data ?? []).map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setFotoAtiva(idx)}
                  className={`overflow-hidden rounded-xl ring-2 ${
                    idx === fotoAtiva ? "ring-brand" : "ring-transparent"
                  }`}
                >
                  <img src={url} alt={`Foto ${idx + 1} de ${dados.titulo}`} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight">
                {dados.titulo}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {[dados.bairro, dados.cidade].filter(Boolean).join(" · ")}
                {dados.categorias ? ` · ${dados.categorias.nome}` : ""}
              </p>
              <p className="mt-1 text-sm">
                <span className="text-brand">{estrelas(repItem.data?.media ?? null)}</span>{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {repItem.data?.media != null
                    ? `${repItem.data.media.toFixed(1)} · ${repItem.data.total} avaliação(ões) do item`
                    : "item ainda sem avaliações"}
                </span>
              </p>
              {dados.profiles ? (
                <Link
                  to="/perfil/$userId"
                  params={{ userId: dados.profiles.id }}
                  className="mt-1 inline-block text-sm text-brand-wood underline-offset-4 hover:underline"
                >
                  Locador: {dados.profiles.nome}
                  {repLocador.data?.media != null ? ` · ★ ${repLocador.data.media.toFixed(1)}` : ""}
                </Link>
              ) : null}
            </div>
            <div className="text-right">
              <span className="text-2xl font-semibold tracking-tight">{moeda(dados.preco_dia)}</span>
              <span className="text-sm text-muted-foreground">/dia</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-foreground/70">{dados.descricao}</p>
          {dados.condicoes_uso ? (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em]">
                Condições de uso ·{" "}
              </span>
              {dados.condicoes_uso}
            </p>
          ) : null}

          <section className="mt-6">
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Avaliações do item</h2>
            {(avalItem.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém avaliou este item ainda.</p>
            ) : (
              <div className="space-y-2">
                {(avalItem.data ?? []).map((a) => (
                  <article key={a.id} className="glass rounded-2xl p-3">
                    <p className="font-mono text-xs text-brand-wood">
                      {estrelas(a.nota_item)} · {a.autor?.nome ?? "usuário"}
                    </p>
                    {a.comentario ? <p className="mt-1 text-sm text-foreground/75">{a.comentario}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="glass-strong h-fit rounded-3xl p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Reservar período</h2>
          <div className="mt-4 rounded-2xl bg-background/70 p-4 ring-1 ring-border">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted-foreground">
                Início
                <input
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="field mt-1"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Fim
                <input
                  type="date"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="field mt-1"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">{dias} dia(s)</span>
              <span className="font-semibold tracking-tight">Total {moeda(total)}</span>
            </div>

            {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}

            {user ? (
              <button
                onClick={() => {
                  setErro(null);
                  reservar.mutate();
                }}
                disabled={reservar.isPending}
                className="mt-4 w-full rounded-2xl bg-brand py-3 text-sm font-medium text-primary-foreground shadow-brand disabled:opacity-60"
              >
                {reservar.isPending ? "Enviando…" : "Solicitar reserva"}
              </button>
            ) : (
              <Link
                to="/auth"
                className="mt-4 block rounded-2xl bg-brand py-3 text-center text-sm font-medium text-primary-foreground shadow-brand"
              >
                Entrar para reservar
              </Link>
            )}
          </div>

          <div className="mt-4">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Disponibilidade
            </p>
            <CalendarioDisponibilidade
              reservados={ocupados.data ?? []}
              bloqueados={bloqueados.data ?? []}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
