if (!DID_DOCUMENT) throw new Error('DID_DOCUMENT is not set')
const response = http.get(DID_DOCUMENT)
if (response.status !== 200) throw new Error(`GET ${DID_DOCUMENT} failed: ${response.status} ${response.body}`)
const document = json(response.body)
const aliases = Array.isArray(document.alsoKnownAs) ? document.alsoKnownAs : []
// The Verana indexers know the did:webvh alias of a playground service, not its did:web id
const did = aliases.find((alias) => typeof alias === 'string' && alias.startsWith('did:webvh:')) || document.id
if (typeof did !== 'string') throw new Error(`${DID_DOCUMENT} has no DID: ${response.body}`)
console.log(`service DID ${did}`)
output.serviceDid = did
