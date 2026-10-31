import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import DeckLibrary from '../../components/Flashcards/DeckLibrary'
import CreateDeck from '../../components/Flashcards/CreateDeck'
import StudyView from '../../components/Flashcards/StudyView'
import DeckDetail from '../../components/Flashcards/DeckDetail'

type View = { name: 'library' } | { name: 'create' } | { name: 'detail'; deckId: string } | { name: 'study'; deckId: string; mode: 'all' | 'due' | 'missed' }

export default function Flashcards() {
  const [view, setView] = useState<View>({ name: 'library' })
  const decks = useLiveQuery(() => db.decks.orderBy('updatedAt').reverse().toArray(), [])

  if (view.name === 'create') return <CreateDeck onBack={() => setView({ name: 'library' })} onCreated={(id) => setView({ name: 'detail', deckId: id })} />
  if (view.name === 'detail') return <DeckDetail deckId={view.deckId} onBack={() => setView({ name: 'library' })} onStudy={(mode) => setView({ name: 'study', deckId: view.deckId, mode })} />
  if (view.name === 'study') return <StudyView deckId={view.deckId} mode={view.mode} onBack={() => setView({ name: 'detail', deckId: view.deckId })} />
  return <DeckLibrary decks={decks ?? []} onCreate={() => setView({ name: 'create' })} onOpen={(id) => setView({ name: 'detail', deckId: id })} />
}
