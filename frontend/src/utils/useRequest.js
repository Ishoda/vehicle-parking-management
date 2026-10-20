import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  clearRequest,
  loadData,
  submitData,
} from '../store/slices/parkingSlice'

const emptyState = {
  data: null,
  loading: false,
  error: '',
}

export default function useRequest(key) {
  const dispatch = useDispatch()
  const state = useSelector(
    (store) => store.parking[key] || emptyState,
  )

  const load = useCallback(
    (url, params) => dispatch(loadData({ key, url, params })),
    [dispatch, key],
  )

  const submit = useCallback(
    (url, data, method = 'post', requestId) =>
      dispatch(
        submitData({ key, url, data, method, requestId }),
      ).unwrap(),
    [dispatch, key],
  )

  const clear = useCallback(
    () => dispatch(clearRequest(key)),
    [dispatch, key],
  )

  return { ...state, load, submit, clear }
}