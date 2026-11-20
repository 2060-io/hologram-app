const response = http.post('http://127.0.0.1:7777/view', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ appId: APP_ID, link: LINK }),
})
if (response.status !== 200) throw new Error(`view failed: ${response.status} ${response.body}`)
