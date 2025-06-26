import React from 'react'

import App from './App'
import CustomToast from './components/CustomToast'

// See documentation about Headless: https://rnfirebase.io/messaging/usage#background-application-state
const AppHeadless = ({ isHeadless }: { isHeadless: boolean }) => {
  if (isHeadless) return null
  return (
    <>
      <CustomToast />
      <App />
    </>
  )
}

export default AppHeadless
