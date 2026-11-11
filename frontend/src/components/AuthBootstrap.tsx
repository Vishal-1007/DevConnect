import { useLayoutEffect, type ReactNode } from 'react'
import { useGetMeQuery } from '../api/authApi'
import { useAppDispatch, useAppSelector } from '../hooks'
import { setAccount } from '../store/authSlice'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.accessToken)
  const { data } = useGetMeQuery(undefined, { skip: !token })

  useLayoutEffect(() => {
    if (data) {
      dispatch(setAccount(data))
    }
  }, [data, dispatch])

  return <>{children}</>
}
