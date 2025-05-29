import { use } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'react-native-localize'

import en from '../locales/en.json'
import es from '../locales/es.json'

import { logError } from './log'

export const languageClient = getLocales() // get list of locales
export const language = languageClient[0].languageCode
export const initializeI18n = new Promise(resolve => {
  use(initReactI18next).init(
    {
      fallbackLng: 'en',
      lng: 'en',
      compatibilityJSON: 'v4',
      interpolation: { escapeValue: false },
      resources: { en, es },
      debug: __DEV__,
    },
    error => {
      resolve('')
      if (error) logError('something went wrong loading i18next', error)
    },
  )
})
