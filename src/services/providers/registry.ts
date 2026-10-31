import type { ProviderInfo } from '../../components/UI/ProviderInstructionsModal'

export const PROVIDERS: Record<string, ProviderInfo> = {
  gemini: {
    name: 'Google Gemini',
    what: 'An API key is a credential that allows AETHER to communicate with the selected external service. It identifies the API project making the request and may be subject to usage limits, billing and provider restrictions.',
    why: 'Gemini uses this key to generate explanations, create flashcards, analyse documents and generate quizzes.',
    website: 'https://aistudio.google.com/',
    docs: 'https://ai.google.dev/gemini-api/docs',
    pricing: 'https://ai.google.dev/gemini-api/docs/pricing',
    steps: [
      'Open the official provider website.',
      'Sign in if required.',
      'Create or obtain an API key if eligible.',
      'Copy the key.',
      'Return to AETHER.',
      'Paste the key into the configuration field.',
      'Press Save.',
      'Press Test Connection.',
    ],
    security: 'Your key is stored in this browser on this device. Browser storage is not a secure credential vault. Other people with access to your browser environment or malicious extensions may be able to access it.',
    eligibility: 'Provider terms include age and use restrictions (including 18+ and restrictions for under-18 access). Do not bypass provider restrictions.',
  },
  spotify: {
    name: 'Spotify',
    what: 'A Client ID identifies your Spotify app for PKCE authentication. No client secret is used in the browser.',
    why: 'Spotify uses this to authorize AETHER to read your currently playing track and playback state.',
    website: 'https://developer.spotify.com/dashboard',
    docs: 'https://developer.spotify.com/documentation/web-api',
    pricing: 'https://developer.spotify.com/',
    steps: [
      'Open the Spotify Developer Dashboard.',
      'Create an app and add a Redirect URI (e.g. http://localhost:5173/callback).',
      'Copy the Client ID.',
      'Return to AETHER Settings → Spotify.',
      'Paste Client ID and Redirect URI.',
      'Press Save, then Connect Spotify.',
    ],
    security: 'Credentials are stored in browser localStorage. Browser storage is not a secure vault.',
    eligibility: 'Subject to Spotify Developer Terms.',
  },
}
