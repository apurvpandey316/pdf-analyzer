import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
        Turn any PDF into flashcards
      </h1>
      <p className="max-w-xl text-lg text-slate-600">
        Upload your notes, get AI-generated flashcards and quizzes, and remember them with spaced
        repetition.
      </p>
      <Link
        to="/register"
        className="rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
      >
        Get started free
      </Link>
      <p className="text-sm text-slate-500">10 free credits when you sign up.</p>
    </main>
  )
}
