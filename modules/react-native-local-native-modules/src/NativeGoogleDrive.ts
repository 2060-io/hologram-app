import { TurboModule, TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  authorize(accountName: string): Promise<boolean>
  getAccessToken(): Promise<string>
  selectAccount(accountName?: string): Promise<string | undefined>
}

export default TurboModuleRegistry.getEnforcing<Spec>('GoogleDrive')
