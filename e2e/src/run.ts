import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Issuer } from './issuer.js'

const adminUrl = process.env.VS_AGENT_ADMIN_URL ?? 'http://localhost:3002'
const maestroDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'maestro')

function runFlow(flow: string, params: Record<string, string>): void {
  const env = Object.entries(params).flatMap(([k, v]) => ['-e', `${k}=${v}`])
  execFileSync('maestro', ['test', ...env, join(maestroDir, flow)], { stdio: 'inherit' })
}

async function main(): Promise<void> {
  const issuer = new Issuer(adminUrl)

  const invitationUrl = await issuer.invitationUrl()
  runFlow('01-connect.yaml', { INVITATION_URL: invitationUrl })

  const credentialDefinitionId = await issuer.ensureCredentialType({
    name: 'e2e-phone',
    version: '1.0',
    attributes: ['phoneNumber'],
  })
  await issuer.offerCredential(credentialDefinitionId, [{ name: 'phoneNumber', value: '+5712345678' }])
  runFlow('02-accept-credential.yaml', {})

  await issuer.requestProof(credentialDefinitionId, ['phoneNumber'])
  runFlow('03-present-proof.yaml', {})

  console.log('e2e: connect -> issue -> present completed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
