import React from 'react'

import App from './App'
import Toast from './components/Toast'

// See documentation about Headless: https://rnfirebase.io/messaging/usage#background-application-state
const AppHeadless = ({ isHeadless }: { isHeadless: boolean }) => {
  if (isHeadless) return null
  return (
    <>
      <Toast />
      <App />
    </>
  )
}

export default AppHeadless
