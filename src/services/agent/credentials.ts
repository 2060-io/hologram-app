import { W3cCredentialRecord, W3cJwtVerifiableCredential } from '@credo-ts/core'

import { getCredentialMainInfo } from './display'
import { jwtAcademicAward, jwtJFFOpenBadge, jwtPermanentResidentCard } from './jwt'

export function getWalletCredentials(): ReturnType<typeof getCredentialMainInfo>[] {
  const academicAwardVc = new W3cCredentialRecord({
    credential: W3cJwtVerifiableCredential.fromSerializedJwt(jwtAcademicAward),
    tags: { expandedTypes: [] },
  })
  const openBadgeVc = new W3cCredentialRecord({
    credential: W3cJwtVerifiableCredential.fromSerializedJwt(jwtJFFOpenBadge),
    tags: { expandedTypes: [] },
  })
  const permanentResidentVc = new W3cCredentialRecord({
    credential: W3cJwtVerifiableCredential.fromSerializedJwt(jwtPermanentResidentCard),
    tags: { expandedTypes: [] },
  })

  return [academicAwardVc, openBadgeVc, permanentResidentVc].map(getCredentialMainInfo)
}
