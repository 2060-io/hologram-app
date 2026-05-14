import { TurboModule, TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  randomKey(length: number): Promise<string>
  encryptFile(filePath: string, outputPath: string, key: string, iv: string, algorithm: string): Promise<boolean>
  decryptFile(filePath: string, outputPath: string, key: string, iv: string, algorithm: string): Promise<boolean>
}

export default TurboModuleRegistry.getEnforcing<Spec>('FileCiphering')
