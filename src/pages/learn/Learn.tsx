import { useState } from 'react'
import Button from '../../components/UI/Button'
import Overview from './Overview'
import ExplainView from './ExplainView'
import QuizView from './QuizView'
import AdaptiveView from './AdaptiveView'
import PlannerView from './PlannerView'
import InsightsView from './InsightsView'

const TABS = ['Overview', 'Explain', 'Quizzes', 'Adaptive', 'Planner', 'Insights']

export default function Learn() {
  const [tab, setTab] = useState('Overview')
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-10 safe-top safe-x space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Learn</h1>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>
      {tab === 'Overview' && <Overview />}
      {tab === 'Explain' && <ExplainView />}
      {tab === 'Quizzes' && <QuizView />}
      {tab === 'Adaptive' && <AdaptiveView />}
      {tab === 'Planner' && <PlannerView />}
      {tab === 'Insights' && <InsightsView />}
    </div>
  )
}
