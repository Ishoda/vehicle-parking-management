import { useState } from 'react'
import { Car, X } from 'lucide-react'

import { RESOURCES } from '../constants/Resources'
import ResourcePage from './ResourcePage'

export default function CustomersPage() {
  const [customer, setCustomer] = useState(null)

  return (
    <>
      <ResourcePage
        config={RESOURCES.customers}
        extraAction={(row) => (
          <button
            type="button"
            className="icon-button vehicle-icon"
            title={`Vehicles for ${row.customerName}`}
            aria-label={`Vehicles for ${row.customerName}`}
            onClick={() => setCustomer(row)}
          >
            <Car size={18} aria-hidden="true" />
          </button>
        )}
      />

      {customer && (
        <section className="customer-vehicles-section">
          <header className="customer-vehicles-heading">
            <div>
              <span>REGISTERED VEHICLES</span>
              <h2>{customer.customerName}</h2>
            </div>

            <button
              type="button"
              className="icon-button"
              title="Close registered vehicles"
              aria-label="Close registered vehicles"
              onClick={() => setCustomer(null)}
            >
              <X size={19} aria-hidden="true" />
            </button>
          </header>

          <ResourcePage
            key={customer.customerID}
            config={RESOURCES.customerVehicles}
            extraParams={{ customerID: customer.customerID }}
            fixedValues={{ customerID: customer.customerID }}
          />
        </section>
      )}
    </>
  )
}