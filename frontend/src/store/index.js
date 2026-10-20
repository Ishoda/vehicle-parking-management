import { configureStore } from '@reduxjs/toolkit'

import authReducer from './slices/authSlice'
import parkingReducer from './slices/parkingSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    parking: parkingReducer,
  },
})

export default store