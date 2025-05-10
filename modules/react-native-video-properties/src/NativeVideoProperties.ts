import type { TurboModule } from 'react-native'

import { TurboModuleRegistry } from 'react-native'

export type MediaInfo = {
  width: number
  height: number
  duration: number
}

export interface Spec extends TurboModule {
  getVideoProperties(videoPath: string): Promise<MediaInfo>
}

export default TurboModuleRegistry.getEnforcing<Spec>('VideoProperties')
