import { useEffect, useState } from "react";

export default function ConditionCard({ name, detail, index }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const score = Number(detail?.score || 0);
  const threshold = Number(detail?.threshold || 0);
  const detected = Boolean(detail?.detected);

  const cardClass = detected ? "bg-amber-50" : "bg-gray-50";
  const barClass = detected ? "bg-amber-400" : "bg-gray-300";
  const titleClass = detected
    ? "text-gray-900 font-bold"
    : "text-gray-500 font-semibold";

  return (
    <div
      className={`${cardClass} rounded-lg p-6 cursor-default hover:scale-[1.02] transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-sm capitalize ${titleClass}`}>{name}</div>
        {detected && (
          <span className="bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-md">
            Detected
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm font-medium text-gray-600">
          <span>Score</span>
          <span>{score.toFixed(1)}%</span>
        </div>
        <div className="bg-gray-200 h-2 rounded-md mt-2 overflow-hidden">
          <div
            className={`${barClass} h-2 rounded-md transition-all duration-700`}
            style={{
              width: animate ? `${score}%` : "0%",
              transitionDelay: `${index * 100}ms`,
            }}
          />
        </div>
        <div className="text-xs text-gray-400 font-medium mt-2">
          Threshold: {threshold.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
