import apiClient from './apiClient'

function utc(value) {
  if (!value) return null
  const text = String(value).trim()
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : `${text}Z`
}

export async function loadPaymentHistory(filters, signal) {
  const response = await apiClient.post(
    '/PaymentHistory/GetPaymentHistory',
    {
      p_paymentType: ({
        ALL: 'ALL',
        DAILY: 'D',
        MONTHLY: 'M',
      })[filters.parkingType] || 'ALL',
      p_fromDate: filters.from || null,
      p_toDate: filters.to || null,
      p_searchTerm: filters.searchTerm?.trim() || null,
    },
    { signal },
  )

  const records = response.data?.resultSet ?? response.data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error('The payment history API returned an unexpected response.')
  }

  return records.map((record) => {
    const row = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
    )

    return {
      paymentKey: `${row.paymenttype}-${row.paymentid}`,
      paymentID: row.paymentid,
      paymentType: row.paymenttype,
      paymentNumber: row.paymentnumber,
      receiptNumber: row.receiptnumber,
      parkingType: row.paymenttype === 'M' ? 'MONTHLY' : 'DAILY',
      customerName: row.customername,
      vehicleNumber: row.vehiclenumber,
      amount: row.amount,
      paymentMethod: ({ CH: 'Cash', CD: 'Card' })[row.paymentmethod]
        ?? row.paymentmethod,
      paymentDateTime: utc(row.paymentdatetime),
      operatorName: row.receivedby,
    }
  })
}