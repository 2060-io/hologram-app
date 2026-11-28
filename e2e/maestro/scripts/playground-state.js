if (!PLAYGROUND_API) throw new Error('PLAYGROUND_API is not set, run the flow with e2e/ci/run-flows.sh or pass -e')
if (KIND !== 'credential' && KIND !== 'proof') throw new Error(`KIND must be credential or proof, not ${KIND}`)
if (!SERVICE || !EXCHANGE_ID || !EXPECT) throw new Error('SERVICE, EXCHANGE_ID and EXPECT must be set')

const POLL_MS = 2000
const timeoutS = Number(TIMEOUT_S || 60)
const url = `${PLAYGROUND_API}/${SERVICE}/${KIND}/${encodeURIComponent(EXCHANGE_ID)}`
const expected = new RegExp(`^(?:${EXPECT})$`)
const deadline = Date.now() + timeoutS * 1000
let last = 'no answer'

let canWait = true
// GraalJS has no timers: Atomics.wait blocks without CPU, and the loop covers an engine where it returns early
const pause = (ms) => {
  const until = Date.now() + ms
  if (canWait) {
    try {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
    } catch (error) {
      canWait = false
      console.log(`busy wait, Atomics.wait failed: ${error}`)
    }
  }
  let now = Date.now()
  while (now < until) now = Date.now()
}

const outcomesOf = (body) => {
  const outcomes = typeof body.state === 'string' ? [body.state] : []
  if (body.done === true || body.state === 'done') outcomes.push('done')
  if (body.declined === true || body.state === 'abandoned' || body.state === 'declined') outcomes.push('declined')
  return outcomes
}

const poll = () => {
  let response
  try {
    response = http.get(url)
  } catch (error) {
    last = String(error)
    return undefined
  }
  if (response.status === 404) throw new Error(`GET ${url} failed: 404 ${response.body}`)
  if (response.status !== 200) {
    last = `${response.status} ${response.body}`
    return undefined
  }
  if (response.body !== last) console.log(`${SERVICE} ${KIND} ${EXCHANGE_ID}: ${response.body}`)
  last = response.body
  const body = json(response.body)
  const outcomes = outcomesOf(body)
  if (outcomes.some((outcome) => expected.test(outcome))) return body
  if (outcomes.includes('done') || outcomes.includes('declined')) {
    throw new Error(`${KIND} ${EXCHANGE_ID} on ${SERVICE} ended in ${body.state}, expected ${EXPECT}`)
  }
  return undefined
}

let state = poll()
while (!state) {
  if (Date.now() > deadline) {
    throw new Error(`${KIND} ${EXCHANGE_ID} on ${SERVICE} did not reach ${EXPECT} in ${timeoutS} s, last: ${last}`)
  }
  pause(POLL_MS)
  state = poll()
}
output.playgroundState = state
