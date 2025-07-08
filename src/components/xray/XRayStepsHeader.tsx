
import React from "react";
import { Scan, Upload } from "lucide-react";

const steps = [
  { key: "select", label: "Select Patient" },
  { key: "upload", label: "Upload Images" },
  { key: "note", label: "Radiologist Notes" },
  { key: "done", label: "Finish" },
];

export function XRayStepsHeader({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, idx) => (
        <React.Fragment key={step.key}>
          <div className="flex flex-col items-center">
            <div
              className={`rounded-full border-2 w-8 h-8 flex items-center justify-center mb-1 transition
                ${
                  idx === stepIndex
                    ? "bg-blue-600 border-blue-600 text-white"
                    : idx < stepIndex
                    ? "bg-blue-100 border-blue-300 text-blue-500"
                    : "bg-gray-200 border-gray-300 text-gray-400"
                }
              `}
            >
              {idx === 0 && <Scan size={20} />}
              {idx === 1 && <Upload size={20} />}
              {idx === 2 && <span className="font-bold text-base">N</span>}
              {idx === 3 && <span className="font-bold text-base">✓</span>}
            </div>
            <span className={`text-xs ${idx === stepIndex ? "text-blue-700 font-semibold" : "text-gray-500"}`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${idx < stepIndex ? "bg-blue-300" : "bg-gray-200"} mx-2 rounded transition`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
