import Button from './Button'
import Card from './Card'

export interface ProviderInfo {
  name: string
  what: string
  why: string
  website: string
  docs: string
  pricing: string
  steps: string[]
  security: string
  eligibility: string
}

export default function ProviderInstructionsModal({ info, open, onClose }: { info: ProviderInfo; open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">{info.name} Setup</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <h3 className="font-medium mt-2">What is this key?</h3>
        <p className="text-sm text-muted mb-3">{info.what}</p>
        <h3 className="font-medium mt-2">Why does AETHER need it?</h3>
        <p className="text-sm text-muted mb-3">{info.why}</p>
        <h3 className="font-medium mt-2">Where do I get it?</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <a href={info.website} target="_blank" rel="noreferrer"><Button variant="secondary">Open Official Website</Button></a>
          <a href={info.docs} target="_blank" rel="noreferrer"><Button variant="secondary">Documentation</Button></a>
          <a href={info.pricing} target="_blank" rel="noreferrer"><Button variant="secondary">Pricing</Button></a>
        </div>
        <h3 className="font-medium mt-2">How do I add it?</h3>
        <ol className="list-decimal list-inside text-sm text-muted space-y-1 mb-3">
          {info.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <h3 className="font-medium mt-2">Is it free?</h3>
        <p className="text-sm text-muted mb-3">AETHER core features are free. The external provider may have free quotas, but quotas can change and some requests may require billing. You are responsible for understanding the provider's pricing and terms. AETHER does not guarantee unlimited free AI requests.</p>
        <h3 className="font-medium mt-2">Is my key safe?</h3>
        <p className="text-sm text-muted mb-3">{info.security}</p>
        <h3 className="font-medium mt-2">Provider requirements</h3>
        <p className="text-sm text-muted">{info.eligibility}</p>
      </Card>
    </div>
  )
}
