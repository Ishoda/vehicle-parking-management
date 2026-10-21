import apiClient from './apiClient'

function utc(value) {
  if (!value) return null
  const text = String(value).trim()
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : `${text}Z`
}

export async function getPaymentReceipt(paymentType, paymentID) {
  if (!['D', 'M'].includes(paymentType) || !Number.isInteger(Number(paymentID)) || Number(paymentID) <= 0) {
    throw new Error('A valid payment type and payment ID are required.')
  }

  const response = await apiClient.post(
    '/PaymentHistory/GetPaymentReceipt',
    {
      p_paymentType: paymentType,
      p_paymentID: Number(paymentID),
    },
  )

  const record = response.data?.resultSet ?? response.data?.ResultSet

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('The backend did not return the saved receipt.')
  }

  const row = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
  )

  if (!row.receiptnumber || row.amount == null) {
    throw new Error('The saved receipt details are incomplete.')
  }

  return {
    receiptNumber: row.receiptnumber,
    paymentNumber: row.paymentnumber,
    companyName: row.facilityname,
    address: row.facilityaddress,
    contactNumber: row.facilitycontactnumber,
    customerName: row.customername,
    vehicleNumber: row.vehiclenumber,
    parkingType: row.paymenttype === 'M' ? 'MONTHLY' : 'DAILY',
    referenceNumber: row.referencenumber,
    entryDateTime: utc(row.entrydatetime),
    exitDateTime: utc(row.exitdatetime),
    paymentDateTime: utc(row.paymentdatetime),

    // Coverage dates are calendar dates, not UTC timestamps.
    periodStart: row.periodstartdate?.slice(0, 10),
    periodEnd: row.periodenddate?.slice(0, 10),

    amount: row.amount,
    paymentMethod: ({ CH: 'Cash', CD: 'Card' })[row.paymentmethod]
      ?? row.paymentmethod,
    paymentStatus: row.paymentstatus,
    operatorName: row.receivedby,
    remarks: row.remarks,
    thankYouMessage: row.receiptmessage,
  }
}