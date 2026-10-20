export function money(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(Number(value))
}

export function dateTime(value) {
  if (!value) return '—'

  return new Date(value).toLocaleString('en-LK', {
    timeZone: 'Asia/Colombo',
  })
}

export function dateOnly(value) {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('en-LK', {
    timeZone: 'Asia/Colombo',
  })
}

export function today() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

export function rows(data) {
  const result = Array.isArray(data)
    ? data
    : data?.items || data?.resultSet || data?.ResultSet || []

  return Array.isArray(result) ? result : []
}