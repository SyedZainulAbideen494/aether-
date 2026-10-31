import { Link } from 'react-router-dom'
import Button from '../components/UI/Button'
import Card from '../components/UI/Card'

export default function Landing() {
  return (
    <div className="min-h-screen">
      <section className="max-w-5xl mx-auto px-4 md:px-8 pt-16 pb-10 text-center">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">Understand Aviation. Not Just Memorise It.</h1>
        <p className="text-muted text-lg mb-8">A free interactive learning platform for exploring aviation concepts, aircraft performance, visual explanations, flashcards and quizzes.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/"><Button>Start Learning</Button></Link>
          <Link to="/pan"><Button variant="secondary">Explore Performance Air Nav</Button></Link>
        </div>
        <p className="text-xs text-faint mt-6">AETHER is independently developed and is not an official aviation authority or flight-training product.</p>
      </section>
      <section className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-4 pb-10">
        {['Interactive Aviation Learning','Performance Air Nav Laboratory','AI-Assisted Explanations','Flashcards and Adaptive Revision','Quizzes and Practice','Learn at Your Own Pace'].map((t) => (
          <Card key={t}><h3 className="font-medium mb-1">{t}</h3><p className="text-xs text-muted">Explore interactive tools and simulations.</p></Card>
        ))}
      </section>
    </div>
  )
}
