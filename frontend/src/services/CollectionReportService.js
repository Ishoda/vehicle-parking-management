import apiClient from './apiClient'

export async function loadCollectionReport(params, signal) {
  const response = await apiClient.post(
    '/Report/Collection',
    {
      p_fromDate: params?.from || null,
      p_toDate: params?.to || null,
    },
    { signal },
  )

  const records = response.data?.resultSet ?? response.data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error('The collection report returned an unexpected response.')
  }

  return records.map((record) => {
    const row = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
    )

    return {
      date: String(row.collectiondate ?? '').slice(0, 10),
      dailyCollection: row.dailyamount,
      monthlyCollection: row.monthlyamount,
      totalCollection: row.totalamount,
      dailyPaymentCount: row.dailypaymentcount,
      monthlyPaymentCount: row.monthlypaymentcount,
    }
  })
}