import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import Card from '../components/UI/Card'
import Button from '../components/UI/Button'
import Input from '../components/UI/Input'
import Toggle from '../components/UI/Toggle'
import Slider from '../components/UI/Slider'
import { VisualizerStyle } from '../types'
import { testGemini } from '../services/gemini/generate'

export default function Settings({ spotify }: { spotify: any }) {
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const spotifyConfig = useAppStore((s) => s.spotifyConfig)
  const setSpotifyConfig = useAppStore((s) => s.setSpotifyConfig)
  const [clientId, setClientId] = useState(spotifyConfig.clientId)
  const [redirectUri, setRedirectUri] = useState(spotifyConfig.redirectUri)
  const [testResult, setTestResult] = useState<string | null>(null)
  const geminiKey = useAppStore((s) => s.settings.geminiApiKey)
  const setGeminiKey = (v: string) => useAppStore.getState().setSettings({ geminiApiKey: v })
  const [geminiInput, setGeminiInput] = useState(geminiKey)
  const [geminiModel, setGeminiModel] = useState(useAppStore.getState().settings.geminiModel)
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null)
  const [geminiTesting, setGeminiTesting] = useState(false)

  const saveCreds = () => {
    setSpotifyConfig({ clientId, redirectUri })
    setTestResult('Saved.')
  }
  const testCreds = async () => {
    setSpotifyConfig({ clientId, redirectUri })
    const ok = await spotify.testConfig()
    setTestResult(ok ? 'Configuration looks valid.' : (spotify.error ?? 'Invalid'))
  }

  const styles: VisualizerStyle[] = ['spectrum', 'waveform', 'equalizer', 'particles', 'rings']

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

      {/* Spotify */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Spotify integration</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${spotify.connected ? 'bg-green-500/15 text-green-300' : 'bg-white/5 text-faint'}`}>
            {spotify.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <p className="text-xs text-muted mb-4">
          Enter your Spotify Client ID and Redirect URI. No client secret is used (PKCE). Credentials are stored locally in your browser.
        </p>
        <div className="space-y-3">
          <Input label="Spotify Client ID" value={clientId} onChange={setClientId} placeholder="your client id" />
          <Input label="Redirect URI" value={redirectUri} onChange={setRedirectUri} placeholder={window.location.origin + '/callback'} hint="Must match the Redirect URI registered in your Spotify app dashboard." />
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveCreds}>Save configuration</Button>
            <Button variant="secondary" onClick={testCreds}>Test configuration</Button>
            {spotify.connected ? (
              <Button variant="danger" onClick={spotify.disconnect}>Disconnect</Button>
            ) : (
              <Button onClick={() => { saveCreds(); spotify.connect() }}>Connect Spotify</Button>
            )}
            <Button variant="ghost" onClick={spotify.clearCredentials}>Clear credentials</Button>
          </div>
          {testResult && <p className="text-xs text-muted">{testResult}</p>}
          {spotify.error && <p className="text-xs text-red-300">{spotify.error}</p>}
        </div>
        <div className="mt-4 text-xs text-faint space-y-1">
          <p>Scopes: user-read-currently-playing, user-read-playback-state</p>
          <p>Browser storage is not a secure server-side vault. Do not use this app on shared devices for sensitive accounts.</p>
        </div>
      </Card>

      {/* Visualizer */}
      <Card>
        <h3 className="text-sm font-medium mb-4">Visualizer</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {styles.map((s) => (
            <Button key={s} variant={settings.visualizer === s ? 'primary' : 'secondary'} onClick={() => setSettings({ visualizer: s })}>
              {s}
            </Button>
          ))}
        </div>
        <Slider label="Intensity" value={settings.visualizerIntensity} min={0.2} max={1} step={0.1} onChange={(v: number) => setSettings({ visualizerIntensity: v })} />
        <div className="mt-4">
          <Toggle label="Demo mode (test visualizer without Spotify)" value={settings.demoMode} onChange={(v) => setSettings({ demoMode: v })} />
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <h3 className="text-sm font-medium mb-4">Appearance</h3>
        <div className="space-y-3">
          <Toggle label="Reduced motion" value={settings.reducedMotion} onChange={(v) => setSettings({ reducedMotion: v })} />
          <Toggle label="Notifications" value={settings.notifications} onChange={(v) => setSettings({ notifications: v })} />
        </div>
        <div className="mt-4">
          <label className="block text-xs text-muted mb-1.5">Theme</label>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map((t) => (
              <Button key={t} variant={settings.theme === t ? 'primary' : 'secondary'} onClick={() => setSettings({ theme: t })}>{t}</Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Ambient sound */}
      <Card>
        <h3 className="text-sm font-medium mb-4">Ambient sounds (local)</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['none', 'rain', 'brown', 'white', 'fire', 'ocean'] as const).map((s) => (
            <Button key={s} variant={settings.ambientSound === s ? 'primary' : 'secondary'} onClick={() => setSettings({ ambientSound: s })}>{s}</Button>
          ))}
        </div>
        <Slider label="Volume" value={settings.ambientVolume} min={0} max={1} step={0.05} onChange={(v: number) => setSettings({ ambientVolume: v })} />
      </Card>


      <Card>
        <h3 className="text-sm font-medium mb-4">AI integration — Google Gemini</h3>
        <p className="text-xs text-muted mb-4">
          Model: gemini-2.5-flash. Enter your Gemini API key. Keys are stored in browser localStorage and are not secure against local inspection.
        </p>
        <div className="space-y-3">
          <Input label="Gemini API Key" value={geminiInput} onChange={setGeminiInput} placeholder="AIza..." type="password" />
          <div>
            <label className="block text-xs text-muted mb-1.5">Model</label>
            <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} className="w-full bg-white/5 border border-line rounded-xl px-3 py-2.5 text-sm">
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => { setGeminiKey(geminiInput); useAppStore.getState().setSettings({ geminiModel }); setGeminiStatus('Saved.') }}>Save API key</Button>
            <Button variant="secondary" disabled={geminiTesting} onClick={async () => {
              setGeminiTesting(true); setGeminiStatus(null)
              try { setGeminiKey(geminiInput); const r = await testGemini(geminiInput, geminiModel); setGeminiStatus('Connection OK: ' + r) }
              catch (e: any) { setGeminiStatus('Failed: ' + (e?.message ?? e)) }
              finally { setGeminiTesting(false) }
            }}>Test connection</Button>
            <Button variant="secondary" disabled={geminiTesting} onClick={async () => {
              setGeminiTesting(true)
              try { setGeminiKey(geminiInput); const r = await testGemini(geminiInput, geminiModel); setGeminiStatus('Test response: ' + r) }
              catch (e: any) { setGeminiStatus('Failed: ' + (e?.message ?? e)) }
              finally { setGeminiTesting(false) }
            }}>Generate test response</Button>
            <Button variant="danger" onClick={() => { setGeminiInput(''); setGeminiKey(''); setGeminiStatus('Deleted.') }}>Delete API key</Button>
          </div>
          {geminiStatus && <p className="text-xs text-muted">{geminiStatus}</p>}
        </div>
      </Card>

      {/* Data */}
      <Card>
        <h3 className="text-sm font-medium mb-4">Data management</h3>
        <Button variant="danger" onClick={() => { if (confirm('Clear all data?')) useAppStore.getState().clearAll() }}>Clear all data</Button>
      </Card>
    </div>
  )
}
