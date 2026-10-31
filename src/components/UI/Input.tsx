export default function Input({ label, value, onChange, type = 'text', placeholder, hint }: any) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs text-muted mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
      />
      {hint && <p className="text-xs text-faint mt-1">{hint}</p>}
    </div>
  )
}
