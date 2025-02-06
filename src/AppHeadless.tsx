import React from 'react'

import App from './App'
import CustomToast from './components/CustomToast'

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
