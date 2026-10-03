import App from '../src/App'
import { EventSchema } from '../components/shared/event-schema'
import { currentEdition } from '../data/current-edition'
import { InstallPrompt } from '../components/shared/install-prompt'

export default function HomePage() {
  return <><EventSchema edition={currentEdition} /><App /><InstallPrompt /></>
}
