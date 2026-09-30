export function formatXaf(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid XAF amount')
  return `${new Intl.NumberFormat('fr-CM').format(amount)} FCFA`
}

export function formatEventDate(date: string, locale = 'fr-CM') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'Africa/Douala' }).format(new Date(`${date}T12:00:00+01:00`))
}
