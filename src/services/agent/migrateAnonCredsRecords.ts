import { AnonCredsCredentialRepository } from '@credo-ts/anoncreds'
import { storeAnonCredsInW3cFormatV0_5 } from '@credo-ts/anoncreds/build/updates/0.4-0.5/anonCredsCredentialRecord'
import { Agent } from '@credo-ts/core'

export async function migrateAnonCredsRecords(agent: Agent) {
  const anonCredsCredentialRepository = agent.dependencyManager.resolve(AnonCredsCredentialRepository)
  const anonCredsCredentialRecords = await anonCredsCredentialRepository.getAll(agent.context)

  if (anonCredsCredentialRecords.length === 0) {
    agent.config.logger.info('No legacy AnonCreds credential records found.')
    return
  }
  agent.config.logger.info('Legacy AnonCreds credential records found. Starting migration')
  await storeAnonCredsInW3cFormatV0_5(agent as Agent)
}
