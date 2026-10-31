export default function Slider({ value, min, max, step = 1, onChange, label }: any) {
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-muted mb-1"><span>{label}</span><span>{value}</span></div>}
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent" />
    </div>
  )
}
