import { use } from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as RNLocalize from 'react-native-localize'

import en from '../locales/en.json'
import es from '../locales/es.json'

import { logError } from './log'

export const languageClient = RNLocalize.getLocales() // get list of locales
export const language = languageClient[0].languageCode
export const initLanguage = new Promise(resolve => {
  use({
    type: 'languageDetector',
    async: true,
    detect: (cb: (value: string) => void) => cb('en'),
    init: () => {},
    cacheUserLanguage: () => {},
  })
    .use(initReactI18next)
    .init(
      {
        fallbackLng: 'en',
        lng: 'cimode',
        compatibilityJSON: 'v3',
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
