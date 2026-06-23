import { ArrowUpRight, Minus, X } from "lucide-react";

const groupStyles = {
  good: {
    title: "Good ingredients",
    badge: "bg-emerald-500 text-white",
    panel: "bg-emerald-50 border-emerald-200",
    accent: "text-emerald-700",
    icon: ArrowUpRight,
  },
  neutral: {
    title: "Neutral ingredients",
    badge: "bg-slate-500 text-white",
    panel: "bg-slate-50 border-slate-200",
    accent: "text-slate-700",
    icon: Minus,
  },
  bad: {
    title: "Avoid ingredients",
    badge: "bg-rose-500 text-white",
    panel: "bg-rose-50 border-rose-200",
    accent: "text-rose-700",
    icon: X,
  },
};

function IngredientRow({ item, accentClass, badgeClass }) {
  const score = Number(item?.score || 0);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group block rounded-xl border border-white/70 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-sm font-bold ${accentClass}`}>{item.name}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
            <span className={`rounded-full px-2.5 py-1 ${badgeClass}`}>
              {score.toFixed(3)}
            </span>
            {item.matched_good_tags ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                Matches good tags
              </span>
            ) : null}
            {item.matched_avoid_tags ? (
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">
                Matches avoid tags
              </span>
            ) : null}
          </div>
        </div>
        <ArrowUpRight className={`h-4 w-4 ${accentClass} opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">
        {item.short_description}
      </p>

      {item.what_does_it_do ? (
        <p className="mt-3 text-xs leading-5 text-slate-500 line-clamp-3">
          {item.what_does_it_do}
        </p>
      ) : null}
    </a>
  );
}

export default function IngredientRecommendations({ ingredients }) {
  if (!ingredients) {
    return null;
  }

  const groups = [
    ["good", ingredients.good || []],
    ["neutral", ingredients.neutral || []],
    ["bad", ingredients.bad || []],
  ];

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-[-0.02em]">
            Ingredient Recommendations
          </h3>
          <p className="mt-1 text-sm text-gray-500 font-medium max-w-2xl">
            Ranked from the detected skin type and conditions. Open any ingredient
            card to view the source reference.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 mt-6">
        {groups.map(([key, items]) => {
          const style = groupStyles[key];
          const Icon = style.icon;
          const visibleItems = items.slice(0, 6);

          return (
            <div key={key} className={`rounded-2xl border p-5 ${style.panel}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${style.badge}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {style.title}
                  </div>
                  <div className={`mt-3 text-sm font-semibold ${style.accent}`}>
                    {items.length} found
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {visibleItems.length ? (
                  visibleItems.map((item) => (
                    <IngredientRow
                      key={item.name}
                      item={item}
                      accentClass={style.accent}
                      badgeClass={style.badge}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/70 bg-white/70 p-4 text-sm text-slate-500">
                    No ingredients in this group.
                  </div>
                )}
              </div>

              {items.length > visibleItems.length ? (
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Showing top {visibleItems.length} of {items.length}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}