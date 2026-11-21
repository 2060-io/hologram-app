const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const base64Url = (text) => {
  let out = ''
  for (let i = 0; i < text.length; i += 3) {
    const n = (text.charCodeAt(i) << 16) | ((text.charCodeAt(i + 1) || 0) << 8) | (text.charCodeAt(i + 2) || 0)
    for (const shift of [18, 12, 6, 0].slice(0, Math.min(4, text.length - i + 1))) out += ALPHABET[(n >> shift) & 63]
  }
  return out
}

if (!PLAYGROUND_API) throw new Error('PLAYGROUND_API is not set, run the flow with e2e/ci/run-flows.sh or pass -e')
if (!SERVICE) throw new Error('SERVICE is not set')
const action = ACTION ? `&action=${encodeURIComponent(ACTION)}` : ''
const url = `${PLAYGROUND_API}/${SERVICE}?format=anoncreds${action}`
const response = http.get(url)
if (response.status !== 200) throw new Error(`GET ${url} failed: ${response.status} ${response.body}`)
const body = json(response.body)
if (!body.url) throw new Error(`GET ${url} returned no invitation: ${response.body}`)
const exchangeId = body.credentialExchangeId || body.proofExchangeId || ''
console.log(`${SERVICE} ${body.kind} ${body.url} exchange ${exchangeId || 'none'}`)
output.playground = { link: `didcomm://invite?_url=${base64Url(body.url)}`, exchangeId }
