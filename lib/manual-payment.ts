import { currentEdition } from '../data/current-edition'
import { formatEventDate } from './formatting'
export const paymentContacts = {
  manuel: { name: 'Manuel', label: 'MoMo avec Manuel', number: '237658846124' },
  youana: { name: 'Youana', label: 'Mobile Money avec Youana', number: '237699051046' },
} as const
export function paymentWhatsAppUrl(contact: keyof typeof paymentContacts, order: { reference: string; quantity: number; total_xaf: number; customer_name: string }) {
  const recipient = paymentContacts[contact]
  const text = `Bonjour ${recipient.name}, je souhaite payer ma commande Classico Mboa du ${formatEventDate(currentEdition.eventDate)}.\nRéférence : ${order.reference}\nNom : ${order.customer_name}\nBillets : ${order.quantity}\nMontant : ${order.total_xaf} XAF\nMerci de me communiquer les instructions de paiement et de confirmer la réception pour délivrer mes billets.`
  return `https://wa.me/${recipient.number}?text=${encodeURIComponent(text)}`
}
