import { useEffect, useState } from "react";

const steps = [
  "Processing front view",
  "Processing left view",
  "Processing right view",
  "Averaging predictions",
  "Detecting conditions",
];

export default function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(true), 10);
    const progressTimer = setTimeout(() => setProgress(90), 150);
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % steps.length);
    }, 1200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(progressTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-[#111827] flex flex-col items-center justify-center gap-6 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex items-center gap-4">
        {["bg-blue-500", "bg-emerald-500", "bg-amber-500"].map(
          (color, index) => (
            <div
              key={color}
              className={`${color} w-16 h-24 rounded-md animate-analysis-pulse`}
              style={{ animationDelay: `${index * 200}ms` }}
            />
          )
        )}
      </div>

      <div className="text-2xl font-bold text-white tracking-[-0.02em]">
        Analyzing your skin...
      </div>
      <div className="text-sm font-medium text-gray-400 tracking-wider uppercase">
        {steps[stepIndex]}
      </div>

      <div className="w-full max-w-xs bg-gray-700 rounded-md h-1 overflow-hidden">
        <div
          className="bg-blue-500 h-1 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
