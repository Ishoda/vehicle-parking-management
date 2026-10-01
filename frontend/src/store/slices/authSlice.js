import {
  createAsyncThunk,
  createSlice,
  isAnyOf,
} from '@reduxjs/toolkit'
import * as authService from '../../services/AuthService'

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authService.login(credentials)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Could not sign in. Please try again.',
      )
    }
  },
)

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getCurrentUser()
    } catch (error) {
      if (error.response?.status === 401) {
        return null
      }

      return rejectWithValue(
        'Could not check your session. Check the backend and try again.',
      )
    }
  },
  {
    condition: (_, { getState }) => {
      const { loading, initialized } = getState().auth
      return !loading && !initialized
    },
  },
)

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      return null
    } catch (error) {
      // A 401 means the session has already expired.
      if (error.response?.status === 401) {
        return null
      }

      return rejectWithValue(
        'Could not log out. Please try again.',
      )
    }
  },
)

const initialState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
  sessionError: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionExpired: (state) => {
    state.user = null
    state.loading = false
    state.initialized = true
    state.sessionError = false
    state.error = 'Your session has expired. Please log in again.'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
        state.initialized = true
        state.sessionError = false
        state.error = null
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.loading = false
        state.initialized = false
        state.sessionError = true
        state.error = action.payload || 'Could not check your session.'
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
        state.initialized = true
        state.sessionError = false
        state.error = null
      })
      .addCase(signIn.rejected, (state, action) => {
        state.user = null
        state.loading = false
        state.error = action.payload || 'Could not sign in.'
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.loading = false
        state.initialized = true
        state.error = null
      })
      .addCase(signOut.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Could not log out.'
      })
      .addMatcher(
        isAnyOf(
          restoreSession.pending,
          signIn.pending,
          signOut.pending,
        ),
        (state) => {
          state.loading = true
          state.error = null
          state.sessionError = false
        },
      )
  },
})

export default authSlice.reducer
export const { sessionExpired } = authSlice.actions