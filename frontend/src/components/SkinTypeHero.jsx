import { useEffect, useState } from "react";

const viewOrder = ["front", "left", "right"];
const viewLabels = {
  front: "Front",
  left: "Left",
  right: "Right",
};

export default function SkinTypeHero({ analysis }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const finalType = analysis.final_skin_type;
  const typeConfidence = Number(analysis.type_confidence || 0);
  const perView = analysis.per_view_skin_types || {};
  const voteText = Object.entries(analysis.vote_counts || {})
    .map(([type, count]) => `${type} x${count}`)
    .join(" | ");

  return (
    <div className="relative bg-blue-500 rounded-lg p-8 mt-8 overflow-hidden">
      <div className="absolute top-[-3rem] right-[-2rem] w-48 h-48 bg-white/10 rounded-full" />
      <div className="absolute bottom-[-3rem] left-[-2rem] w-40 h-40 bg-white/10 rounded-full" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="text-blue-100 text-sm font-semibold tracking-widest uppercase">
            Skin Type
          </div>
          <div className="text-6xl font-extrabold text-white tracking-[-0.02em] mt-2">
            {finalType}
          </div>
          <div className="mt-6">
            <div className="text-blue-100 text-sm font-medium">
              Confidence: {typeConfidence.toFixed(1)}%
            </div>
            <div className="bg-white/20 rounded-md h-2 w-48 mt-2 overflow-hidden">
              <div
                className="bg-white h-2 rounded-md transition-all duration-700"
                style={{ width: animate ? `${typeConfidence}%` : "0%" }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="text-blue-100 text-xs font-semibold tracking-widest uppercase mb-3">
            View Breakdown
          </div>
          <div className="flex flex-wrap gap-3">
            {viewOrder.map((view) => {
              const info = perView[view];
              if (!info) {
                return null;
              }
              const matches = info.skin_type === finalType;
              return (
                <div
                  key={view}
                  className="bg-white/10 rounded-md px-4 py-3 min-w-[140px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-semibold uppercase tracking-wider">
                      {viewLabels[view]}
                    </span>
                    {matches && (
                      <span className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </div>
                  <div className="text-white text-base font-bold mt-1">
                    {info.skin_type}
                  </div>
                  <div className="text-blue-200 text-xs font-medium">
                    {Number(info.confidence || 0).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-blue-100 text-sm font-medium mt-4">
            Votes: {voteText || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
