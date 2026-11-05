var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
function base64url(text) {
  var out = ''
  for (let i = 0; i < text.length; i += 3) {
    const a = text.charCodeAt(i)
    const b = text.charCodeAt(i + 1)
    const c = text.charCodeAt(i + 2)
    out += CHARS[a >> 2] + CHARS[((a & 3) << 4) | (b >> 4)]
    if (!Number.isNaN(b)) out += CHARS[((b & 15) << 2) | (c >> 6)]
    if (!Number.isNaN(c)) out += CHARS[c & 63]
  }
  return out
}
var response = http.get(INVITATION_API)
if (!response.ok) throw new Error(INVITATION_API + ' returned ' + response.status)
var body = json(response.body)
output.link = 'didcomm://invite?_url=' + base64url(body.url)
output.exchangeId = body.credentialExchangeId
console.log('invitation ' + body.url + ' exchange ' + body.credentialExchangeId)
