import { useEffect, useState } from "react";

import ConditionGrid from "./ConditionGrid.jsx";
import IngredientRecommendations from "./IngredientRecommendations.jsx";
import PhotoStrip from "./PhotoStrip.jsx";
import SkinTypeHero from "./SkinTypeHero.jsx";
import ViewBreakdown from "./ViewBreakdown.jsx";

export default function ResultsPage({ analysis, uploads, onReset }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const conditionEntries = Object.entries(analysis.condition_scores || {});
  const conditionOrder = conditionEntries.map(([name]) => name);

  return (
    <div
      className={`min-h-screen bg-white transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-100 py-4">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="text-xl font-extrabold text-gray-900">SkinIQ</div>
          <button
            type="button"
            onClick={onReset}
            className="bg-gray-100 text-gray-700 font-semibold text-sm px-5 py-2 rounded-md hover:bg-gray-200 hover:scale-105 transition-all duration-200"
          >
            Analyze Again
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <SkinTypeHero analysis={analysis} />

        <ConditionGrid
          conditionEntries={conditionEntries}
          detectedConditions={analysis.detected_conditions || []}
        />

        <ViewBreakdown
          perViewCondScores={analysis.per_view_cond_scores || {}}
          conditionOrder={conditionOrder}
        />

        <IngredientRecommendations ingredients={analysis.ingredients} />

        <PhotoStrip uploads={uploads} />

        <div className="mt-16 py-8 border-t-2 border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-sm">
            <span className="font-bold text-gray-900">SkinIQ</span>
            <span className="text-gray-400"> AI Skin Analysis</span>
          </div>
          <p className="text-xs text-gray-400 font-medium max-w-sm md:text-right">
            For informational purposes only. Not a substitute for professional
            dermatological advice.
          </p>
        </div>
      </div>
    </div>
  );
}
