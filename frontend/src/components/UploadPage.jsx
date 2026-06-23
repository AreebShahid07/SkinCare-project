import { ArrowRight, Camera, Check, Sun, User } from "lucide-react";

import UploadZone from "./UploadZone.jsx";

const viewConfigs = [
  {
    key: "front",
    stepLabel: "Front",
    title: "Front view",
    hint: "Face the camera directly",
    direction: "^ Face forward",
  },
  {
    key: "left",
    stepLabel: "Left",
    title: "Left view",
    hint: "Turn head left",
    direction: "<- Turn left",
  },
  {
    key: "right",
    stepLabel: "Right",
    title: "Right view",
    hint: "Turn head right",
    direction: "Turn right ->",
  },
];

export default function UploadPage({
  uploads,
  apiError,
  onFileSelect,
  onRemove,
  onSubmit,
}) {
  const uploadedCount = viewConfigs.filter((view) => uploads[view.key].file)
    .length;
  const totalSteps = viewConfigs.length;
  const remaining = totalSteps - uploadedCount;
  const ready = remaining === 0;
  const activeIndex = uploadedCount < totalSteps ? uploadedCount : -1;
  const activeKey = activeIndex >= 0 ? viewConfigs[activeIndex].key : null;
  const counterText = `${uploadedCount} / ${totalSteps} uploaded`;

  let buttonLabel = "Upload 3 photos";
  if (uploadedCount > 0 && !ready) {
    buttonLabel = `${remaining} more needed`;
  }
  if (ready) {
    buttonLabel = "ANALYZE NOW";
  }

  let buttonClasses = "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed";
  if (ready) {
    buttonClasses =
      "bg-[#3B6FF0] text-white hover:bg-[#2F5FD0] scale-[1.03]";
  }

  const segmentFilled = [uploadedCount > 0, uploadedCount > 1];
  const activeLineLeft = `${((activeIndex * 2 + 1) / 6) * 100}%`;

  return (
    <div
      className="min-h-screen bg-[#F7F8FC] text-[#0F172A]"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <style>{
        "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');"
      }</style>

      <header className="bg-white border-b border-[rgba(0,0,0,0.06)] h-14">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <div className="text-[18px] font-bold text-[#0F172A]">SkinIQ</div>
          <div className="flex flex-wrap gap-3">
            {[
              "Skin Type Detection",
              "5 Condition Analysis",
              "3-View Accuracy",
            ].map((item) => (
              <span
                key={item}
                className="bg-[#EEF2FF] text-[#3B6FF0] text-[12px] font-medium px-3 py-1.5 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="bg-[#4A7AF5]">
        <div className="h-[180px] flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full tracking-[0.08em]">
            3-VIEW AI ANALYSIS
          </div>
          <h2 className="text-[38px] font-bold text-white mt-3">
            Upload your photos
          </h2>
          <p className="text-[15px] text-white/80 font-normal mt-2">
            Three views. Thirty seconds. AI-powered skin insights.
          </p>
        </div>
      </section>

      <section className="bg-[#F7F8FC] pb-10">
        <div className="max-w-[860px] mx-auto px-6 relative">
          <div className="mt-7">
            <div className="relative">
              <div
                className={`absolute left-[16.666%] top-4 h-[2px] w-[33.333%] rounded-full transition-colors duration-300 ${
                  segmentFilled[0] ? "bg-[#22C55E]" : "bg-[#E2E8F0]"
                }`}
              />
              <div
                className={`absolute left-[50%] top-4 h-[2px] w-[33.333%] rounded-full transition-colors duration-300 ${
                  segmentFilled[1] ? "bg-[#22C55E]" : "bg-[#E2E8F0]"
                }`}
              />
              <div className="grid grid-cols-3 items-center relative z-10">
                {viewConfigs.map((view, index) => {
                  const isCompleted = index < uploadedCount;
                  const isActive = index === activeIndex;
                  const nodeClasses = isCompleted
                    ? "bg-[#22C55E] text-white"
                    : isActive
                      ? "bg-[#3B6FF0] text-white"
                      : "bg-[#E2E8F0] text-[#94A3B8]";
                  return (
                    <div key={view.key} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold ${nodeClasses}`}
                        style={
                          isActive
                            ? {
                                boxShadow:
                                  "0 0 0 4px rgba(59,111,240,0.15)",
                              }
                            : undefined
                        }
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="mt-2 text-[12px] font-medium text-[#64748B]">
                        {view.stepLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          

          {apiError && (
            <div className="mt-6 mb-6 bg-red-50 border border-red-300 rounded-[12px] p-4 text-red-700 font-semibold text-sm">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {viewConfigs.map((view) => (
              <UploadZone
                key={view.key}
                id={view.key}
                viewKey={view.key}
                title={view.title}
                hint={view.hint}
                direction={view.direction}
                isActive={view.key === activeKey}
                value={uploads[view.key]}
                error={uploads[view.key].error}
                onFileSelect={(file) => onFileSelect(view.key, file)}
                onRemove={() => onRemove(view.key)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-[rgba(0,0,0,0.06)] py-4">
        <div className="max-w-[860px] mx-auto px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#EEF2FF] rounded-lg p-1.5">
                <Sun className="w-5 h-5 text-[#3B6FF0]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0F172A]">
                  Good lighting
                </div>
                <div className="text-xs text-[#64748B]">
                  Natural light, no flash
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[#EEF2FF] rounded-lg p-1.5">
                <User className="w-5 h-5 text-[#3B6FF0]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0F172A]">
                  Face framing
                </div>
                <div className="text-xs text-[#64748B]">
                  Shoulders up, centered
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[#EEF2FF] rounded-lg p-1.5">
                <Camera className="w-5 h-5 text-[#3B6FF0]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#0F172A]">Stay still</div>
                <div className="text-xs text-[#64748B]">No blur or motion</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className={`text-[11px] font-medium ${
                ready ? "text-[#22C55E]" : "text-[#94A3B8]"
              }`}
            >
              {counterText}
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!ready}
              className={`h-12 rounded-[12px] px-7 text-[15px] font-semibold tracking-wide uppercase flex items-center justify-center gap-2 transition-all duration-200 ${buttonClasses}`}
            >
              {buttonLabel}
              {ready && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
