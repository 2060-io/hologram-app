import type { TurboModule } from 'react-native'

import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  getSharedText(callback: (callback: { data: { mimeType: string; data: string }[] }) => void): void
  // Required by NativeEventEmitter on the New Architecture
  addListener(eventName: string): void
  removeListeners(count: number): void
}

export default TurboModuleRegistry.getEnforcing<Spec>('ShareMenu')
