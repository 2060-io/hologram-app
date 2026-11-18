const payload = { appId: APP_ID }
if (typeof TEXT !== 'undefined') payload.text = TEXT
if (typeof MEDIA !== 'undefined') payload.media = MEDIA

const response = http.post('http://127.0.0.1:7777/share', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
if (response.status !== 200) throw new Error(`share failed: ${response.status} ${response.body}`)
