export default function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-center justify-between gap-3 w-full">
      {label && <span className="text-sm text-ink">{label}</span>}
      <span className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-accent' : 'bg-white/10'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}
