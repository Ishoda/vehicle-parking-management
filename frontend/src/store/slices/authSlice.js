import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { API } from '../../constants/Api'
import { getData, saveData } from '../../services/ParkingService'
import { getErrorMessage } from '../../services/apiClient'

function normalizeUser(data) {
  const user = data?.user || data
  const role = String(user?.role ?? user?.userRole ?? '')
    .trim()
    .toUpperCase()

  if (!user || !['AD', 'OP'].includes(role)) {
    throw new Error('The backend did not return a supported user role.')
  }

  return { ...user, role }
}

function authError(error) {
  if (error.response) {
    return getErrorMessage(error)
  }

  if (error.isAxiosError) {
    return (
      'Could not connect to the server. ' +
      'Check your connection and try again.'
    )
  }

  return error.message || 'Could not complete authentication.'
}

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue, signal }) => {
    try {
      const data = await getData(API.currentUser, undefined, signal)
      return normalizeUser(data)
    } catch (error) {
      if (error.response?.status === 401) {
        return null
      }

      return rejectWithValue(authError(error))
    }
  },
)

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await saveData(API.login, credentials)
      return normalizeUser(data)
    } catch (error) {
      return rejectWithValue(authError(error))
    }
  },
)

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await saveData(API.logout)
      return null
    } catch (error) {
      if (error.response?.status === 401) {
        return null
      }

      return rejectWithValue(authError(error))
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    initialized: false,
    loading: false,
    error: '',
    requestId: null,
  },

  reducers: {
    sessionExpired(state) {
      state.user = null
      state.initialized = true
      state.loading = false
      state.requestId = null
      state.error = 'Your session has expired. Please sign in again.'
    },
  },

  extraReducers: (builder) => {
    for (const action of [restoreSession, signIn, signOut]) {
      builder.addCase(action.pending, (state, event) => {
        state.loading = true
        state.error = ''
        state.requestId = event.meta.requestId
      })

      builder.addCase(action.fulfilled, (state, event) => {
        if (state.requestId !== event.meta.requestId) {
          return
        }

        state.user = event.payload
        state.loading = false
        state.initialized = true
        state.error = ''
        state.requestId = null
      })

      builder.addCase(action.rejected, (state, event) => {
        if (state.requestId !== event.meta.requestId) {
          return
        }

        state.loading = false
        state.requestId = null
        state.error = event.meta.aborted
          ? ''
          : event.payload || 'Could not complete authentication.'
      })
    }
  },
})

export const { sessionExpired } = authSlice.actions
export default authSlice.reducer