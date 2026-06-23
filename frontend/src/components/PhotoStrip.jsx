const viewOrder = ["front", "left", "right"];
const viewLabels = {
  front: "Front View",
  left: "Left View",
  right: "Right View",
};

export default function PhotoStrip({ uploads }) {
  return (
    <div className="mt-10">
      <h3 className="text-xl font-extrabold text-gray-900 tracking-[-0.02em]">
        Your Photos
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {viewOrder.map((view) => {
          const photo = uploads[view];
          return (
            <div key={view}>
              <div className="rounded-lg overflow-hidden aspect-square bg-gray-100">
                {photo?.previewUrl ? (
                  <img
                    src={photo.previewUrl}
                    alt={`${viewLabels[view]} uploaded`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mt-2">
                {viewLabels[view]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
