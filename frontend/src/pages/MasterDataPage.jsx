import { useState } from 'react'
import {
  Banknote,
  CalendarDays,
  Car,
  Contact,
  ParkingSquare,
  Users,
} from 'lucide-react'

import { RESOURCES } from '../constants/Resources'
import { PageHeader } from '../components/UI'
import ResourcePage from './ResourcePage'
import CustomersPage from './CustomersPage'

const tabs = [
  { id: 'spaces', label: 'Spaces', icon: ParkingSquare },
  { id: 'vehicleTypes', label: 'Vehicle types', icon: Car },
  { id: 'rates', label: 'Parking rates', icon: Banknote },
  { id: 'customers', label: 'Customers', icon: Contact },
  { id: 'users', label: 'Users', icon: Users },
  {
    id: 'monthlyContracts',
    label: 'Monthly parking',
    icon: CalendarDays,
  },
]

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('spaces')

  return (
    <div className="master-data-page">
      <PageHeader title="Master data"/>

      <nav className="master-tabs" aria-label="Master data sections">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          const active = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              className={`master-tab ${active ? 'active' : ''}`}
              aria-pressed={active}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon size={18} aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="master-tab-content">
        {activeTab === 'customers' ? (
          <CustomersPage />
        ) : (
          <ResourcePage
            key={activeTab}
            config={RESOURCES[activeTab]}
          />
        )}
      </div>
    </div>
  )
}