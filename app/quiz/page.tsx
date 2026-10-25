import type { Metadata } from 'next'
import { ClassicoPredictionClient } from '../../components/quiz/classico-prediction-client'
import { QuizClient } from '../../components/quiz/quiz-client'
import { getClassicoPredictionAvailability } from '../../lib/classico-prediction'
import { getQuizAvailability, getQuizChannels } from '../../lib/quiz'
import { socialOpenGraphFor, socialTwitterFor } from '../../lib/social-metadata'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  const isClassicoEventDay = getClassicoPredictionAvailability().isEventDay
  const title = isClassicoEventDay ? 'Pronostics du Clásico' : 'Quiz quotidien'
  const description = isClassicoEventDay
    ? 'Pronostique le score, le buteur et le passeur décisif du Clásico.'
    : '5 questions chaque soir à partir de 20H. Teste tes connaissances du Clásico et partage ton score.'
  const eventPreview = {
    url: 'https://classicomboa.com/share-image?page=quiz&v=6',
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'Aperçu des pronostics du Clásico avec le visuel FC Barcelona contre Real Madrid.',
  }
  return {
    title,
    description,
    openGraph: {
      ...socialOpenGraphFor('/quiz', 'Quiz Classico Mboa', description),
      ...(isClassicoEventDay ? { images: [eventPreview] } : {}),
    },
    twitter: {
      ...socialTwitterFor('/quiz', 'Quiz Classico Mboa', description),
      ...(isClassicoEventDay ? { images: [eventPreview] } : {}),
    },
  }
}

export default async function QuizPage() {
  const classico = getClassicoPredictionAvailability()
  if (classico.isEventDay) {
    const channels = await getQuizChannels()
    return <ClassicoPredictionClient availability={classico} channels={channels} />
  }

  const [availability, channels] = await Promise.all([getQuizAvailability(), getQuizChannels()])
  return <QuizClient initialAvailability={availability} initialChannels={channels} />
}
