import { currentEdition } from '../data/current-edition'
import { formatEventDate } from './formatting'
export const paymentContacts = {
  manuel: { provider: 'MTN Mobile Money', name: 'Manuel', label: 'MTN Mobile Money', paymentNumber: '237682750811', contactNumber: '237658846124', logo: 'https://cdn.simpleicons.org/mtn/ffcc00' },
  youana: { provider: 'Orange Money', name: 'Youana', label: 'Orange Money', paymentNumber: undefined, contactNumber: '237699051046', logo: 'https://cdn.simpleicons.org/orange/ff7900' },
} as const
export function paymentWhatsAppUrl(contact: keyof typeof paymentContacts, order: { reference: string; quantity: number; total_xaf: number; customer_name: string }) {
  const recipient = paymentContacts[contact]
  const text = `Bonjour ${recipient.name}, je souhaite payer par ${recipient.provider} ma commande Classico Mboa du ${formatEventDate(currentEdition.eventDate)}.\nRéférence : ${order.reference}\nNom : ${order.customer_name}\nBillets : ${order.quantity}\nMontant : ${order.total_xaf} XAF\nMerci de me communiquer les instructions de paiement et de confirmer la réception pour délivrer mes billets.`
  return `https://wa.me/${recipient.contactNumber}?text=${encodeURIComponent(text)}`
}
