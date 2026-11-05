var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
function base64url(text) {
  var out = ''
  for (var i = 0; i < text.length; i += 3) {
    var a = text.charCodeAt(i)
    var b = text.charCodeAt(i + 1)
    var c = text.charCodeAt(i + 2)
    out += CHARS[a >> 2] + CHARS[((a & 3) << 4) | (b >> 4)]
    if (!isNaN(b)) out += CHARS[((b & 15) << 2) | (c >> 6)]
    if (!isNaN(c)) out += CHARS[c & 63]
  }
  return out
}
var response = http.get('https://playground.testnet.verana.network/api/demo/' + SERVICE + '?format=anoncreds')
if (!response.ok) throw new Error('playground returned ' + response.status)
var body = json(response.body)
output.link = 'didcomm://invite?_url=' + base64url(body.url)
output.exchangeId = body.credentialExchangeId
console.log('offer ' + body.url + ' exchange ' + body.credentialExchangeId)
