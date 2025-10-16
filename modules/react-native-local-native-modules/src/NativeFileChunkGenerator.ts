import { TurboModule, TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  createChunks(filePath: string, outputFilePathPrefix: string, chunkSize: number): Promise<string[]>
}

export default TurboModuleRegistry.getEnforcing<Spec>('FileChunkGenerator')
