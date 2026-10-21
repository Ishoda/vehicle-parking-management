import apiClient from './apiClient'

const ticketAPI = '/ParkingTicketSearch'
const exitAPI = '/ParkingExitPayment'

function normalize(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('Unexpected API response. Check current parking before retrying.')
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
  )
}

function utc(value) {
  if (!value) return null
  const text = String(value).trim()
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : `${text}Z`
}

async function post(url, data, config) {
  const response = await apiClient.post(url, data, config)
  return response.data?.resultSet ?? response.data?.ResultSet
}

function ticket(record) {
  const row = normalize(record)

  return {
    ticketID: row.vpt_ticket_id,
    ticketNumber: row.vpt_ticket_number,
    ticketStatus: row.vpt_ticket_status,
    parkingType: row.vpt_parking_type === 'M' ? 'MONTHLY' : 'DAILY',
    vehicleNumber: row.vpv_vehicle_number,
    vehicleType: row.vvt_type_name,
    vehicleTypeName: row.vvt_type_name,
    customerName: row.customername,
    mobileNumber: row.mobilenumber,
    spaceCode: row.vps_space_code,
    entryDateTime: utc(row.vpt_entry_date_time),
    exitDateTime: utc(row.vpt_exit_date_time),
    contractNumber: row.vpm_contract_number,
    paidAmount: row.dailypaidamount,
  }
}

export async function loadCurrentParking(signal) {
  const records = await post(`${ticketAPI}/GetTickets`, {
    p_parkingType: 'ALL',
    p_onlyCurrent: true,
  }, { signal })

  if (!Array.isArray(records)) {
    throw new Error('The ticket API returned an unexpected response.')
  }

  return records.map(ticket)
}

export async function lookupExit(params, signal) {
  const search = String(params?.searchTerm ?? '').trim()
  if (!search) throw new Error('Enter a vehicle or ticket number.')

  const records = await post(`${ticketAPI}/SearchTickets`, {
    p_searchTerm: search,
    p_parkingType: 'A',
    p_onlyCurrent: true,
  }, { signal })

  if (!Array.isArray(records)) {
    throw new Error('The ticket search returned an unexpected response.')
  }

  const list = records.map(ticket)
  const exact = list.filter((row) =>
    [row.ticketNumber, row.vehicleNumber].some(
      (value) => String(value ?? '').toUpperCase() === search.toUpperCase(),
    ),
  )
  const matches = exact.length ? exact : list

  if (!matches.length) throw new Error('No currently parked vehicle found.')
  if (matches.length > 1) {
    throw new Error('Multiple matches. Enter the complete ticket number.')
  }

  const found = ticket(await post(`${ticketAPI}/GetTicketByID`, {
    p_ticketID: Number(matches[0].ticketID),
  }, { signal }))

  if (found.exitDateTime || !['O', 'PP'].includes(found.ticketStatus)) {
    throw new Error('This ticket is no longer available for exit.')
  }

  if (found.parkingType === 'MONTHLY' || found.ticketStatus === 'PP') {
    return found
  }

  const preview = normalize(await post(`${exitAPI}/PreviewDailyFee`, {
    p_ticketID: Number(found.ticketID),
  }, { signal }))

  const amount = preview.vpt_calculated_amount
  const time = utc(preview.vpt_fee_calculated_date)

  if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) < 0 || !time) {
    throw new Error('The backend returned an invalid fee preview.')
  }

  return {
    ...found,
    amountDue: Number(amount),
    billableHours: preview.vpt_billable_hours,
    calculationTimeUTC: time,
  }
}

export async function processExit(data, monthly, requestId) {
  const exitOnly = monthly || data.ticketStatus === 'PP'
  const payload = { p_ticketID: Number(data.ticketID) }

  if (!exitOnly) {
    if (
      !['CH', 'CD'].includes(data.paymentMethod) ||
      data.expectedAmount == null ||
      !Number.isFinite(Number(data.expectedAmount)) ||
      Number(data.expectedAmount) < 0 ||
      !data.calculationTimeUTC
    ) {
      throw new Error('Refresh the fee preview and select a payment method.')
    }

    Object.assign(payload, {
      p_paymentMethod: data.paymentMethod,
      p_expectedAmount: Number(data.expectedAmount),
      p_calculationTimeUTC: data.calculationTimeUTC,
      p_exitNow: true,
    })
  }

  const row = normalize(await post(
    `${exitAPI}/${exitOnly ? 'CompleteExit' : 'ReceiveDailyPayment'}`,
    payload,
    { headers: requestId ? { 'Idempotency-Key': requestId } : {} },
  ))

  if (!row.vpt_exit_date_time) {
    throw new Error('Exit was not confirmed. Check current parking before retrying.')
  }

  return {
    ticketID: row.vpt_ticket_id,
    ticketNumber: row.vpt_ticket_number,
    parkingType: monthly ? 'MONTHLY' : 'DAILY',
    paymentID: row.vpp_payment_id,
    paymentNumber: row.vpp_payment_number,
    receiptNumber: row.vpp_receipt_number,
    amount: row.vpt_calculated_amount,
    spaceID: row.vpt_space_id,
    spaceStatus: row.vps_space_status,
    exitDateTime: utc(row.vpt_exit_date_time),
  }
}