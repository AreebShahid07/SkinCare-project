import { Check } from "lucide-react";

import ConditionCard from "./ConditionCard.jsx";

export default function ConditionGrid({ conditionEntries, detectedConditions }) {
  const hasDetected = detectedConditions && detectedConditions.length > 0;

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-extrabold text-gray-900 tracking-[-0.02em]">
        Skin Conditions
      </h3>

      <div className="mt-3">
        <div className="text-gray-500 text-sm font-medium mb-3">Detected:</div>
        <div className="flex flex-wrap gap-2">
          {hasDetected ? (
            detectedConditions.map((condition) => (
              <span
                key={condition}
                className="bg-amber-400 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              >
                {condition}
              </span>
            ))
          ) : (
            <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-2">
              All Clear
              <Check className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {conditionEntries.map(([name, detail], index) => (
          <ConditionCard
            key={name}
            name={name}
            detail={detail}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
