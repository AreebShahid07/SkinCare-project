import { useEffect, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";

export default function UploadZone({
  id,
  viewKey,
  title,
  hint,
  direction,
  value,
  error,
  isActive,
  onFileSelect,
  onRemove,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [dropPulse, setDropPulse] = useState(false);
  const hasFile = Boolean(value?.file && value?.previewUrl);
  const isCompleted = hasFile;
  const isFocused = Boolean(isActive && !isCompleted);
  const uploadInputRef = useRef(null);
  const captureInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pulseTimeoutRef = useRef(null);

  const triggerPulse = () => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }
    setDropPulse(true);
    pulseTimeoutRef.current = setTimeout(() => {
      setDropPulse(false);
    }, 150);
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      triggerPulse();
    }
    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
      triggerPulse();
    }
  };

  let borderColor = "#CBD5E1";
  let borderStyle = "border-dashed";
  if (isCompleted) {
    borderColor = "#22C55E";
    borderStyle = "border-solid";
  } else if (isFocused || dragActive) {
    borderColor = "#3B6FF0";
    borderStyle = "border-solid";
  }
  if (error) {
    borderColor = "#EF4444";
    borderStyle = "border-solid";
  }

  const zoneClasses = [
    "relative w-full rounded-[16px] transition-all duration-150",
    "border-[1.5px]",
    borderStyle,
    "overflow-hidden",
    "group",
    isCompleted ? "bg-[#F0FDF4]" : "bg-white",
    !isCompleted ? "cursor-pointer" : "cursor-default",
    dropPulse ? "scale-[1.01]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const dropZoneClasses = [
    "relative h-[200px] flex flex-col items-center justify-center transition-colors duration-150",
    "rounded-t-[14px]",
    "overflow-hidden",
    isCompleted ? "bg-transparent" : "bg-[#F8FAFC]",
    (isFocused || dragActive || dropPulse) && !isCompleted ? "bg-[#EEF2FF]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const directionText = dragActive ? "Drop here" : direction;

  const openUpload = () => {
    uploadInputRef.current?.click();
  };

  const openCapture = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      captureInputRef.current?.click();
      return;
    }
    setCameraError("");
    setIsCameraOpen(true);
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    setCameraError("");
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }
        const file = new File([blob], `${viewKey}-capture.jpg`, {
          type: "image/jpeg",
        });
        onFileSelect(file);
        closeCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  useEffect(() => {
    if (!isCameraOpen) {
      stopStream();
      return;
    }

    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => {
        setCameraError("Camera access was blocked. Check permissions.");
      });

    return () => {
      mounted = false;
      stopStream();
    };
  }, [isCameraOpen]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div className={zoneClasses} style={{ borderColor }}>
        <input
          id={`file-${id}`}
          ref={uploadInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
        />
        <input
          id={`capture-${id}`}
          ref={captureInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          onChange={handleChange}
        />

        <div
          className={dropZoneClasses}
          onClick={() => {
            if (!isCompleted) {
              openUpload();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isCompleted ? (
            <>
              <img
                src={value.previewUrl}
                alt={`${title} preview`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-[#22C55E] flex items-center justify-center transition-transform duration-200 ease-out ${
                  isCompleted ? "scale-100" : "scale-0"
                }`}
              >
                <Check className="w-4 h-4 text-white" />
              </div>
            </>
          ) : (
            <>
              <svg
                className="w-16 h-16"
                viewBox="0 0 64 64"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
              >
                <circle cx="32" cy="24" r="14" />
                <path d="M16 52c4-8 12-12 16-12s12 4 16 12" />
              </svg>
              <div className="text-xs text-[#94A3B8] font-medium mt-4 text-center">
                {directionText}
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-4 border-t border-[rgba(0,0,0,0.08)]">
          <p className="text-[14px] font-semibold text-[#0F172A]">
            {title}
          </p>
          <p className="text-[12px] text-[#64748B] mt-1">{hint}</p>
          {isCompleted ? (
            <button
              type="button"
              className="mt-3 w-full h-10 rounded-[10px] bg-[#F1F5F9] text-[#3B6FF0] text-[13px] font-semibold transition-colors duration-200"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                openUpload();
              }}
            >
              Change photo
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <button
                type="button"
                className="w-full h-10 rounded-[10px] bg-[#3B6FF0] text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-[#2F5FD0]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openUpload();
                }}
              >
                <Camera className="w-4 h-4" />
                Upload photo
              </button>
              <button
                type="button"
                className="w-full h-[38px] rounded-[10px] border border-[#CBD5E1] text-[#3B6FF0] text-[13px] font-medium flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-[#EEF2FF]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openCapture();
                }}
              >
                <Camera className="w-4 h-4" />
                Use camera
              </button>
            </div>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      )}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-[16px] w-full max-w-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.08)] flex items-center justify-between">
              <div className="text-sm font-semibold text-[#0F172A]">
                Capture {title.toLowerCase()} photo
              </div>
              <button
                type="button"
                className="text-[#64748B] text-sm font-medium"
                onClick={closeCamera}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="bg-[#F8FAFC] rounded-[12px] overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              </div>
              {cameraError && (
                <div className="mt-3 text-xs font-medium text-red-500">
                  {cameraError}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="bg-[#E2E8F0] text-[#64748B] rounded-[10px] px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  onClick={closeCamera}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-[#3B6FF0] text-white rounded-[10px] px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  onClick={capturePhoto}
                >
                  Capture photo
                </button>
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
