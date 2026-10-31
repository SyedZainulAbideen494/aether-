import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-line glass mt-10 py-6 px-4 text-xs text-muted">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between">
        <span>© AETHER — independent learning platform.</span>
        <div className="flex flex-wrap gap-3">
          <Link to="/help" className="hover:text-ink">Help</Link>
          <Link to="/help/ai-setup" className="hover:text-ink">AI Setup</Link>
          <Link to="/legal" className="hover:text-ink">Legal</Link>
          <Link to="/privacy-data" className="hover:text-ink">Privacy & Data</Link>
        </div>
      </div>
    </footer>
  )
}
