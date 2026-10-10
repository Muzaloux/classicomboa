import type { Metadata } from 'next'
import { QuizClient } from '../../components/quiz/quiz-client'
import { getQuizAvailability, getQuizChannels } from '../../lib/quiz'
import { socialOpenGraphFor, socialTwitterFor } from '../../lib/social-metadata'

export const dynamic = 'force-dynamic'

const description = '5 questions chaque soir à partir de 20H. Teste tes connaissances du Clásico et partage ton score.'
export const metadata: Metadata = {
  title: 'Quiz quotidien',
  description,
  openGraph: socialOpenGraphFor('/quiz', 'Quiz Classico Mboa', description),
  twitter: socialTwitterFor('/quiz', 'Quiz Classico Mboa', description),
}

export default async function QuizPage() {
  const [availability, channels] = await Promise.all([getQuizAvailability(), getQuizChannels()])
  return <QuizClient initialAvailability={availability} initialChannels={channels} />
}
