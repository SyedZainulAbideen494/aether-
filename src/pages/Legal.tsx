import { useState } from 'react'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'

const DOCS: Record<string, string> = {
  'Terms and Conditions': `AETHER is an independent aviation education platform. It provides educational tools, interactive simulations, learning materials and optional AI-assisted educational features.

Core platform access is free. No subscription is required for basic access. Features may change. Third-party providers may impose separate fees, quotas or restrictions. Availability is not guaranteed.

Users must use the platform lawfully, respect intellectual property rights, and not abuse or disrupt the service.

Educational disclaimer: content is for education and general understanding. It is not flight instruction, an approved flight-training course, an operational flight manual, aircraft-specific performance data, dispatch software, or a substitute for instructor supervision or approved aircraft documentation.

Third-party services have their own terms, availability, fees and privacy policies.

Liability: to be reviewed by a qualified lawyer. Do not claim to exclude rights that cannot legally be excluded.

Governing law: [CONFIGURE JURISDICTION]. Legal contact: [CONFIGURE LEGAL EMAIL].`,
  'Privacy Policy': `AETHER stores learning data locally on your device by default (IndexedDB and localStorage). No account is required. We do not collect personal information beyond what is necessary for the service.

When you connect a third-party AI provider, selected content may be sent to that provider for processing. Review that provider's privacy policy.

Data minimisation is used. You can export or delete your data in Settings → Privacy & Data.

Do not claim full DPDP/GDPR compliance without implementation and legal review.`,
  'Cookie and Storage Policy': `AETHER uses browser storage (localStorage, IndexedDB, Cache Storage) for functionality and offline support. No tracking cookies are set by default. Analytics are off by default.`,
  'AI Usage Disclaimer': `AI features are optional. Providers have their own eligibility, quotas, pricing and terms. AETHER does not guarantee AI availability. Do not bypass provider age or eligibility restrictions.`,
  'Aviation Education Disclaimer': `AETHER is independent and not affiliated with or endorsed by DGCA, ICAO, any airline, manufacturer or aviation authority. Simulations and calculations are educational and illustrative. They must not be used for actual flight operations, dispatch, takeoff/landing performance or flight planning. Use current approved aircraft documentation and authorised procedures.`,
  'Copyright Policy': `Do not reproduce copyrighted textbooks in full. Users are responsible for rights to uploaded materials. Uploaded documents are private to the user. AETHER does not claim ownership of user content.`,
  'Acceptable Use Policy': `Use AETHER lawfully. Do not upload material you lack rights to. Do not abuse, attack, scrape or disrupt the service. Do not misuse AI features.`,
  'Third-Party Services Policy': `Third-party AI providers have their own terms, pricing and privacy policies. AETHER is not responsible for third-party service availability or changes.`,
  'Contact and Legal Enquiries': `Legal contact: [CONFIGURE LEGAL EMAIL]. No postal address or phone number is provided until configured.`,
  'Content Correction and Takedown': `To request correction or takedown of content, contact [CONFIGURE LEGAL EMAIL].`,
}

export default function Legal() {
  const [doc, setDoc] = useState('Terms and Conditions')
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Legal Centre</h1>
      <div className="flex flex-wrap gap-2">
        {Object.keys(DOCS).map((d) => (
          <Button key={d} variant={doc === d ? 'primary' : 'secondary'} onClick={() => setDoc(d)}>{d}</Button>
        ))}
      </div>
      <Card>
        <h2 className="text-xl font-semibold mb-3">{doc}</h2>
        <pre className="whitespace-pre-wrap text-sm text-muted font-sans">{DOCS[doc]}</pre>
      </Card>
    </div>
  )
}
