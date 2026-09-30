import { PageHero } from '../../../components/shared/page'
import { RetrieveOrderForm } from '../../../components/tickets/checkout-form'
export const metadata = { title: 'Retrouver ma commande', robots: { index: false, follow: false } }
export default function RetrievePage() { return <main id="main-content" className="page-container"><PageHero eyebrow="BILLETTERIE" title="Retrouvez vos billets." description="Utilisez la référence et la clé privée enregistrées lors de votre commande." /><RetrieveOrderForm /></main> }
