import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from './UI/Button'
import Card from './UI/Card'

export default function UtilityDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-0 right-0 z-50 h-full w-80 max-w-[90vw] bg-elevated border-l border-line shadow-float p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">More</h3>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-2">
          <Link to="/help" onClick={onClose} className="block"><Card className="hover:bg-white/5"><p className="text-sm">Help & Guides</p></Card></Link>
          <Link to="/help/ai-setup" onClick={onClose} className="block"><Card className="hover:bg-white/5"><p className="text-sm">AI Setup</p></Card></Link>
          <Link to="/settings" onClick={onClose} className="block"><Card className="hover:bg-white/5"><p className="text-sm">API Configuration</p></Card></Link>
          <Link to="/privacy-data" onClick={onClose} className="block"><Card className="hover:bg-white/5"><p className="text-sm">Privacy & Data</p></Card></Link>
          <Link to="/legal" onClick={onClose} className="block"><Card className="hover:bg-white/5"><p className="text-sm">Terms & Conditions</p></Card></Link>
          <Link to="/landing" onClick={onClose} className="block"><Card className="hover:bg-white/5"><p className="text-sm">About AETHER</p></Card></Link>
        </div>
      </div>
    </>
  )
}
