import { z } from 'zod'
import * as gemini from './providers/gemini.js'

// Add a provider by writing services/providers/<name>.js with the same generate() function.
const providers = { gemini }

const studySetSchema = z.object({
  title: z.string().min(1).max(120),
  cards: z
    .array(
      z.object({
        front: z.string().min(1).max(500),
        back: z.string().min(1).max(1500),
      }),
    )
    .min(3),
  quiz: z
    .array(
      z.object({
        question: z.string().min(1),
        options: z.array(z.string().min(1)).length(4),
        answerIndex: z.number().int().min(0).max(3),
        explanation: z.string().optional(),
      }),
    )
    .min(1),
})

// JSON Schema sent to the model so it returns exactly this shape.
const jsonSchema = z.toJSONSchema(studySetSchema)

const SYSTEM = `You are an expert teacher who writes study material from a student's notes.
Write flashcards that test one fact or idea each, in the student's language.
- Front: a clear question or prompt. Back: a concise, complete answer.
- Cover the most important concepts across the whole document, not just the start.
- Quiz: multiple-choice questions with exactly 4 options, one correct, plausible distractors.
- Use only information from the document. Do not invent facts.`

function buildPrompt(text, { cardCount, quizCount }) {
  return `Create about ${cardCount} flashcards and ${quizCount} quiz questions from this document.
Also give the deck a short title (max 8 words).

<document>
${text}
</document>`
}

// Scale the amount of material with the length of the document.
function targetCounts(text) {
  const cardCount = Math.min(40, Math.max(8, Math.round(text.length / 1500)))
  const quizCount = Math.min(15, Math.max(5, Math.round(cardCount / 3)))
  return { cardCount, quizCount }
}

export async function generateStudySet(text, modelConfig) {
  const provider = providers[modelConfig.provider]
  if (!provider) throw new Error(`Unknown AI provider: ${modelConfig.provider}`)

  const raw = await provider.generate({
    model: modelConfig.model,
    system: SYSTEM,
    prompt: buildPrompt(text, targetCounts(text)),
    jsonSchema,
  })

  let parsed
  try {
    parsed = studySetSchema.parse(JSON.parse(raw))
  } catch {
    throw new Error('AI returned data in an unexpected format')
  }
  // Drop quiz questions whose answer index doesn't match an option.
  parsed.quiz = parsed.quiz.filter((q) => q.answerIndex < q.options.length)
  return parsed
}
