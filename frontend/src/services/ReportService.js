import apiClient from './apiClient'

const endpoints = {
  collection: '/Report/Collection',
  vehicles: '/Report/VehicleEntryExit',
  monthly: '/Report/MonthlyCustomers',
}

function utc(value) {
  if (!value) return null
  const text = String(value).trim()
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : `${text}Z`
}

export async function loadReport(type, filters, signal) {
  if (!endpoints[type]) throw new Error('Unknown report type.')

  const response = await apiClient.post(
    endpoints[type],
    {
      p_fromDate: filters.from,
      p_toDate: filters.to,
      p_parkingType: type === 'vehicles'
        ? filters.parkingType
        : 'ALL',
      p_searchTerm: type === 'collection'
        ? null
        : filters.searchTerm.trim() || null,
    },
    { signal },
  )

  const records = response.data?.resultSet ?? response.data?.ResultSet

  if (!Array.isArray(records)) {
    throw new Error('The report API returned an unexpected response.')
  }

  return records.map((record) => {
    const row = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
    )

    if (type === 'collection') {
      return {
        date: row.collectiondate?.slice(0, 10),
        dailyCollection: row.dailyamount,
        monthlyCollection: row.monthlyamount,
        total: row.totalamount,
        dailyPaymentCount: row.dailypaymentcount,
        monthlyPaymentCount: row.monthlypaymentcount,
      }
    }

    if (type === 'vehicles') {
      return {
        ticketNumber: row.vpt_ticket_number,
        vehicleNumber: row.vpv_vehicle_number,
        vehicleType: row.vvt_type_name,
        customerName: row.customername,
        spaceCode: row.vps_space_code,
        parkingType: row.vpt_parking_type === 'M' ? 'Monthly' : 'Daily',
        status: ({
          O: 'Open',
          PP: 'Paid, exit pending',
          CL: 'Closed',
          CN: 'Cancelled',
        })[row.vpt_ticket_status] || row.vpt_ticket_status,
        entryDateTime: utc(row.vpt_entry_date_time),
        exitDateTime: utc(row.vpt_exit_date_time),
        amount: row.vpt_calculated_amount,
      }
    }

    return {
      contractNumber: row.vpm_contract_number,
      customerName: row.vpc_customer_name,
      mobileNumber: row.vpc_mobile_number,
      vehicleNumber: row.vpv_vehicle_number,
      monthlyFee: row.vpm_monthly_fee,
      startDate: row.vpm_start_date?.slice(0, 10),
      endDate: row.vpm_end_date?.slice(0, 10),
      status: ({
        A: 'Active',
        U: 'Upcoming',
        E: 'Expired',
        CN: 'Cancelled',
      })[row.effectivecontractstatus || row.vpm_contract_status] || 'Unknown',
      paidToday: row.haspaidcoveragetoday ? 'Yes' : 'No',
      paymentCount: row.completedpaymentcount,
      totalPaid: row.totalcompletedpayments,
    }
  })
}