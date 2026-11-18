const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const base64Url = (text) => {
  let out = ''
  for (let i = 0; i < text.length; i += 3) {
    const n = (text.charCodeAt(i) << 16) | ((text.charCodeAt(i + 1) || 0) << 8) | (text.charCodeAt(i + 2) || 0)
    for (const shift of [18, 12, 6, 0].slice(0, Math.min(4, text.length - i + 1))) out += ALPHABET[(n >> shift) & 63]
  }
  return out
}

if (!CHATBOT_BACKEND) throw new Error('CHATBOT_BACKEND is not set, run the flow with e2e/ci/run-flows.sh or pass -e')
const url = `${CHATBOT_BACKEND}/invitation?label=${encodeURIComponent(RUN_ID || 'e2e')}`
const response = http.get(url)
if (response.status !== 200) throw new Error(`GET ${url} failed: ${response.status} ${response.body}`)
const body = json(response.body)
if (!body.url || !body.invitationId) throw new Error(`GET ${url} returned no invitation: ${response.body}`)
console.log(`chatbot invitation ${body.invitationId} ${body.url}`)
output.chatbot = { link: `didcomm://invite?_url=${base64Url(body.url)}`, invitationId: body.invitationId }
