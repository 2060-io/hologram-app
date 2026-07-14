import { CredentialTypeService, InvitationService } from '@verana-labs/vs-agent-client'
import { ApiVersion } from '@verana-labs/vs-agent-client'

export interface Claim {
  name: string
  value: string
}

export interface CredentialTypeSpec {
  name: string
  version: string
  attributes: string[]
}

export class Issuer {
  private readonly invitations: InvitationService
  private readonly credentialTypes: CredentialTypeService

  constructor(adminBaseUrl: string, version: ApiVersion = ApiVersion.V1) {
    this.invitations = new InvitationService(adminBaseUrl, version)
    this.credentialTypes = new CredentialTypeService(adminBaseUrl, version)
  }

  async invitationUrl(): Promise<string> {
    const result = await this.invitations.create()
    return result.url
  }

  async ensureCredentialType(spec: CredentialTypeSpec): Promise<string> {
    const existing = await this.credentialTypes.getAll()
    const match = existing.find((t) => t.name === spec.name && t.version === spec.version)
    if (match) return match.id
    const created = await this.credentialTypes.create({
      name: spec.name,
      version: spec.version,
      attributes: spec.attributes,
    })
    return created.id
  }

  async offerCredential(credentialDefinitionId: string, claims: Claim[]): Promise<string> {
    const result = await this.invitations.createCredentialOffer({ credentialDefinitionId, claims })
    return result.url
  }

  async requestProof(credentialDefinitionId: string, attributes: string[]): Promise<string> {
    const result = await this.invitations.createPresentationRequest({
      requestedCredentials: [{ credentialDefinitionId, attributes }],
      requireNonRevocation: false,
    })
    return result.url
  }
}
