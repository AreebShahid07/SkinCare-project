import { useState } from "react";

import LoadingScreen from "./components/LoadingScreen.jsx";
import ResultsPage from "./components/ResultsPage.jsx";
import UploadPage from "./components/UploadPage.jsx";

const API_URL = "https://shark-app-i925j.ondigitalocean.app/api/v1/analyze";
const MAX_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIEW_ORDER = ["front", "left", "right"];

const createEmptyUpload = () => ({
  file: null,
  previewUrl: "",
  error: "",
  name: "",
});

const createInitialUploads = () => ({
  front: createEmptyUpload(),
  left: createEmptyUpload(),
  right: createEmptyUpload(),
});

const validateFile = (file) => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, or WebP files are allowed.";
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return `File must be under ${MAX_MB}MB.`;
  }
  return "";
};

export default function App() {
  const [stage, setStage] = useState("upload");
  const [uploads, setUploads] = useState(createInitialUploads);
  const [analysis, setAnalysis] = useState(null);
  const [apiError, setApiError] = useState("");

  const allReady = VIEW_ORDER.every((view) => uploads[view].file);

  const handleFileSelect = (view, file) => {
    const error = validateFile(file);
    setApiError("");

    setUploads((prev) => {
      const previous = prev[view];
      if (previous.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }

      if (error) {
        return {
          ...prev,
          [view]: {
            ...createEmptyUpload(),
            error,
            name: file.name,
          },
        };
      }

      const previewUrl = URL.createObjectURL(file);
      return {
        ...prev,
        [view]: {
          file,
          previewUrl,
          error: "",
          name: file.name,
        },
      };
    });
  };

  const handleRemove = (view) => {
    setUploads((prev) => {
      const previous = prev[view];
      if (previous.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }

      return {
        ...prev,
        [view]: createEmptyUpload(),
      };
    });
  };

  const handleReset = () => {
    setUploads((prev) => {
      VIEW_ORDER.forEach((view) => {
        const previous = prev[view];
        if (previous.previewUrl) {
          URL.revokeObjectURL(previous.previewUrl);
        }
      });
      return createInitialUploads();
    });
    setAnalysis(null);
    setApiError("");
    setStage("upload");
  };

  const handleSubmit = async () => {
    if (!allReady) {
      return;
    }

    setStage("loading");
    setApiError("");
    setAnalysis(null);

    const formData = new FormData();
    VIEW_ORDER.forEach((view) => {
      formData.append(view, uploads[view].file);
    });

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        let message = `Request failed (${response.status})`;
        if (text) {
          try {
            const data = JSON.parse(text);
            message = data.detail || message;
          } catch {
            message = text;
          }
        }

        setApiError(message);
        setStage("upload");
        return;
      }

      const data = await response.json();
      setAnalysis(data);
      setStage("results");
    } catch {
      setApiError("Could not connect to the analysis service.");
      setStage("upload");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-outfit">
      {stage === "upload" && (
        <UploadPage
          uploads={uploads}
          apiError={apiError}
          onFileSelect={handleFileSelect}
          onRemove={handleRemove}
          onSubmit={handleSubmit}
        />
      )}
      {stage === "loading" && <LoadingScreen />}
      {stage === "results" && analysis && (
        <ResultsPage
          analysis={analysis}
          uploads={uploads}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
