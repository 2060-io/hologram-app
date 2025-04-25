import type { TurboModule } from 'react-native'

import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  getSharedText(callback: (callback: { data: { mimeType: string; data: string }[] }) => void): void
}

export default TurboModuleRegistry.getEnforcing<Spec>('ShareMenu')
