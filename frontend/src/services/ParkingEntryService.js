import apiClient from './apiClient'
import { loadSpaces } from './ParkingSpaceService'

export async function loadEntrySpaces(vehicleTypeID, signal) {
  const spaces = await loadSpaces(
    {
      vehicleTypeID,
      spaceStatus: 'AV',
    },
    signal,
  )

  return spaces.filter(
    (space) =>
      String(space.vehicleTypeID) === String(vehicleTypeID) &&
      space.spaceStatus === 'AV',
  )
}

function utcTimestamp(value) {
  if (!value) return null

  const timestamp = String(value).trim()

  // The entry procedure records UTC. The C# DateTime response
  // may omit the timezone suffix.
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)
    ? timestamp
    : `${timestamp}Z`
}

export async function registerEntry(data, parkingType, requestId) {
  const response = await apiClient.post(
    '/ParkingEntry/RegisterEntry',
    {
      p_parkingType: parkingType,
      p_vehicleID: data.vehicleID || null,
      p_vehicleNumber: data.vehicleNumber,
      p_vehicleTypeID: data.vehicleTypeID,
      p_spaceID: data.spaceID || null,
      p_customerName: data.customerName || null,
      p_mobileNumber: data.mobileNumber || null,
      p_entryDescription: data.entryDescription || null,
    },
    {
      headers: requestId
        ? { 'Idempotency-Key': requestId }
        : {},
    },
  )

  const body = response.data
  const record = body?.resultSet ?? body?.ResultSet

  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error(
      'The entry API returned no ticket details. Check current parking before retrying.',
    )
  }

  const values = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  )

  if (!values.vpt_ticket_id || !values.vpt_ticket_number) {
    throw new Error(
      'The entry response is incomplete. Check current parking before retrying.',
    )
  }

  return {
    ticketID: values.vpt_ticket_id,
    ticketNumber: values.vpt_ticket_number,
    vehicleID: values.vpt_vehicle_id,
    vehicleNumber: data.vehicleNumber,
    spaceID: values.vpt_space_id,
    parkingType: values.vpt_parking_type,
    entryDateTime: utcTimestamp(values.vpt_entry_date_time),
  }
}