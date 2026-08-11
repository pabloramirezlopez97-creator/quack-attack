interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function Stepper({ value, min, max, onChange, label }: StepperProps) {
  function dec() {
    onChange(Math.max(min, value - 1));
  }
  function inc() {
    onChange(Math.min(max, value + 1));
  }

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="stepper-btn"
        onClick={dec}
        disabled={value <= min}
        aria-label="Restar"
      >
        −
      </button>
      <span className="stepper-value">{value}</span>
      <button
        type="button"
        className="stepper-btn"
        onClick={inc}
        disabled={value >= max}
        aria-label="Sumar"
      >
        +
      </button>
    </div>
  );
}
