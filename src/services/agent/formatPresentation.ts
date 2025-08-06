import { DifPexCredentialsForRequest, DifPexCredentialsForRequestSubmissionEntry } from '@credo-ts/core'

import { MobileAgent } from './MobileAgent'
import { getCredentialMainInfo, getPresentationRequestForDisplay } from './display'

import { VerifierInfo } from '@2060/model'

export interface FormattedSubmission {
  name: string
  purpose?: string
  areAllSatisfied: boolean
  entries: FormattedSubmissionEntry[]
  verifier: VerifierInfo
}

interface FormattedSubmissionEntry {
  id: string
  name: string
  isSatisfied: boolean
  description?: string
  credentials: ReturnType<typeof getCredentialMainInfo>[]
  requestedAttributes?: Array<string>
}

export function formatW3cPresentationSubmission(
  presentationSubmission: DifPexCredentialsForRequest,
  verifier: VerifierInfo,
): FormattedSubmission {
  const entries = presentationSubmission.requirements.flatMap(requirement => {
    return requirement.submissionEntry.map((submission: DifPexCredentialsForRequestSubmissionEntry) => {
      const entry = {
        id: submission.name ?? '',
        name: submission.name ?? '',
        description: submission.purpose,
        isSatisfied: submission.verifiableCredentials.length >= 1,
        credentials: submission.verifiableCredentials.map(c => getCredentialMainInfo(c.credentialRecord)),
      }

      entry.name = entry.name ?? entry.credentials[0]?.schemaName ?? 'N/A'
      return entry
    })
  })

  return {
    areAllSatisfied: entries.every(entry => entry.isSatisfied),
    name: presentationSubmission.name ?? 'N/A',
    purpose: presentationSubmission.purpose,
    entries,
    verifier,
  }
}

export async function formatDidcommPresentationSubmission(options: {
  agent: MobileAgent
  proofRecordId: string
  verifierInfo: VerifierInfo
}): Promise<FormattedSubmission> {
  const { requestedCredentials, verifier } = await getPresentationRequestForDisplay({
    ...options,
    includeMatches: true,
  })

  const entries = requestedCredentials.map(requirement => {
    const entry = {
      id: requirement.id ?? '',
      name: requirement.schemaName ?? '',
      isSatisfied: requirement.matches ? requirement.matches?.length >= 1 : false,
      credentials: requirement.matches?.map(match => match.credentialMainInfo) ?? [],
      requestedAttributes: requirement.attributes,
    }
    return entry
  })

  return {
    name: '',
    areAllSatisfied: entries.every(entry => entry.isSatisfied),
    entries,
    verifier,
  }
}
