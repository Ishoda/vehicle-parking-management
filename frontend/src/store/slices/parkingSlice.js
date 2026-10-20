import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { getData, saveData } from '../../services/ParkingService'
import { getErrorMessage } from '../../services/apiClient'
import { sessionExpired } from './authSlice'

function handleFailure(error, thunk) {
  if (error.response?.status === 401) {
    thunk.dispatch(sessionExpired())
  }

  return thunk.rejectWithValue(getErrorMessage(error))
}

export const loadData = createAsyncThunk(
  'parking/loadData',
  async (args, thunk) => {
    try {
      return await getData(args.url, args.params, thunk.signal)
    } catch (error) {
      return handleFailure(error, thunk)
    }
  },
)

export const submitData = createAsyncThunk(
  'parking/submitData',
  async (args, thunk) => {
    try {
      return await saveData(
        args.url,
        args.data,
        args.method,
        args.requestId,
      )
    } catch (error) {
      return handleFailure(error, thunk)
    }
  },
)

const parkingSlice = createSlice({
  name: 'parking',
  initialState: {},

  reducers: {
    clearRequest(state, action) {
      delete state[action.payload]
    },
  },

  extraReducers: (builder) => {
    for (const action of [loadData, submitData]) {
      builder.addCase(action.pending, (state, event) => {
        const key = event.meta.arg.key

        state[key] = {
          ...state[key],
          loading: true,
          error: '',
          requestId: event.meta.requestId,
        }
      })

      builder.addCase(action.fulfilled, (state, event) => {
        const key = event.meta.arg.key

        if (state[key]?.requestId !== event.meta.requestId) {
          return
        }

        state[key] = {
          data: event.payload,
          loading: false,
          error: '',
        }
      })

      builder.addCase(action.rejected, (state, event) => {
        const key = event.meta.arg.key

        if (state[key]?.requestId !== event.meta.requestId) {
          return
        }

        state[key] = {
          ...state[key],
          loading: false,
          error: event.meta.aborted
            ? ''
            : event.payload || 'Request failed.',
        }
      })
    }

    builder.addCase(sessionExpired, () => ({}))

    builder.addMatcher(
      (action) =>
        action.type === 'auth/signOut/fulfilled' ||
        action.type === 'auth/signIn/fulfilled',
      () => ({}),
    )
  },
})

export const { clearRequest } = parkingSlice.actions
export default parkingSlice.reducer