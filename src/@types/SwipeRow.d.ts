import { ReactNode } from 'react'

declare module 'react-native-swipe-list-view' {
  // eslint-disable-next-line
  interface IPropsSwipeRow<T> {
    children: ReactNode
  }
}
