import apiClient from './apiClient'

function normalize(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
  )
}

async function post(action, signal) {
  const response = await apiClient.post(
    `/Dashboard/${action}`,
    {},
    { signal },
  )

  return response.data?.resultSet ?? response.data?.ResultSet
}

export async function loadDashboard(signal) {
  const record = await post('GetSummary', signal)

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('The dashboard API returned an unexpected response.')
  }

  const row = normalize(record)

  return {
    totalSpaces: row.totalspaces,
    occupiedSpaces: row.occupiedspaces,
    availableSpaces: row.availablespaces,
    reservedSpaces: row.reservedspaces,
    blockedSpaces: row.blockedspaces,
    otherSpaces: row.otherspaces,
    todayDailyVehicles: row.todaydailyvehicles,
    todayMonthlyVehicles: row.todaymonthlyvehicles,
    currentlyParkedCount: row.currentlyparkedvehicles,
    todayDailyRevenue: row.todaydailyrevenue,
    todayMonthlyRevenue: row.todaymonthlyrevenue,
  }
}

export async function loadSpaceAvailability(signal) {
  const records = await post('GetParkingSpaceBoard', signal)

  if (!Array.isArray(records)) {
    throw new Error('The space board API returned an unexpected response.')
  }

  const counts = {
    total: records.length,
    available: 0,
    occupied: 0,
    reserved: 0,
    blocked: 0,
    other: 0,
  }

  const statusNames = {
    AV: 'available',
    AVAILABLE: 'available',
    OC: 'occupied',
    OCCUPIED: 'occupied',
    RE: 'reserved',
    RESERVED: 'reserved',
    B: 'blocked',
    BLOCKED: 'blocked',
  }

  const spaces = records.map((record) => {
    const row = normalize(record)
    const spaceStatus = String(row.spacestatus ?? '').trim().toUpperCase()

    counts[statusNames[spaceStatus] || 'other'] += 1

    return {
      spaceID: row.spaceid,
      spaceCode: row.spacecode,
      spaceName: row.spacename,
      vehicleTypeName: row.vehicletype,
      spaceStatus,
      blockReason: row.blockreason,
      ticketNumber: row.ticketnumber,
      vehicleNumber: row.vehiclenumber,
    }
  })

  return { spaces, counts }
}