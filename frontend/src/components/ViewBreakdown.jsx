const viewOrder = ["front", "left", "right"];
const viewLabels = {
  front: "Front View",
  left: "Left View",
  right: "Right View",
};

export default function ViewBreakdown({ perViewCondScores, conditionOrder }) {
  return (
    <div className="mt-10">
      <h3 className="text-xl font-extrabold text-gray-900 tracking-[-0.02em]">
        Per-View Breakdown
      </h3>
      <p className="text-sm text-gray-500 font-normal mt-1">
        Raw sigmoid scores before averaging
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {viewOrder.map((view) => {
          const scores = perViewCondScores[view] || {};
          return (
            <div key={view}>
              <div className="bg-gray-900 text-white font-bold text-sm uppercase tracking-widest px-4 py-3 rounded-t-lg">
                {viewLabels[view]}
              </div>
              <div className="bg-gray-50 rounded-b-lg p-4 space-y-3">
                {conditionOrder.map((condition) => {
                  const value = Number(scores[condition] || 0);
                  return (
                    <div key={`${view}-${condition}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-600 capitalize">
                          {condition}
                        </span>
                        <span className="font-bold text-gray-900">
                          {value.toFixed(1)}%
                        </span>
                      </div>
                      <div className="bg-gray-200 h-1 rounded-md mt-1 overflow-hidden">
                        <div
                          className="bg-blue-400 h-1 rounded-md"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
