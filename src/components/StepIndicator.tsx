import { Check } from "lucide-react";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < currentStep
                  ? "bg-safe text-safe-foreground"
                  : i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="mt-1 hidden text-[10px] font-medium text-muted-foreground sm:block">
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-1 h-0.5 w-6 rounded sm:w-10 ${
                i < currentStep ? "bg-safe" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
