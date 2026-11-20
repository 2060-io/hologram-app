import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'

const PORT = 7777
const APP_IDS = new Set(['io.twentysixty.mobileagent.dev', 'io.twentysixty.mobileagent.st'])
const SAFE_TEXT = /^[\w .,!?-]{1,200}$/
const MEDIA = {
  jpg: { mime: 'image/jpeg', table: 'images' },
  png: { mime: 'image/png', table: 'images' },
  mp4: { mime: 'video/mp4', table: 'video' },
}

const adbShell = (args) => execFileSync('adb', ['shell', ...args], { encoding: 'utf8', timeout: 30000 })

const amStart = (args) => {
  const output = adbShell(['am', 'start', '-W', ...args])
  if (/^Error|Exception/m.test(output) || !/Status: ok/.test(output)) throw new Error(`am start failed: ${output}`)
  return output
}

const findMediaUri = (name) => {
  const media = MEDIA[name.split('.').pop()]
  if (!media) throw new Error(`unsupported media ${name}`)
  const uri = `content://media/external/${media.table}/media`
  const rows = adbShell(['content', 'query', '--uri', uri, '--projection', '_id:_display_name'])
  const id = rows
    .split('\n')
    .filter((row) => row.includes(`_display_name=${name}`))
    .map((row) => row.match(/_id=(\d+)/)?.[1])
    .filter(Boolean)
    .pop()
  if (!id) throw new Error(`no media named ${name} in ${uri}`)
  return { uri: `${uri}/${id}`, mime: media.mime }
}

const share = ({ appId, text, media }) => {
  if (!APP_IDS.has(appId)) throw new Error(`unknown app ${appId}`)
  let extras
  if (text !== undefined) {
    if (!SAFE_TEXT.test(text)) throw new Error(`text must match ${SAFE_TEXT}`)
    extras = ['-t', 'text/plain', '--es', 'android.intent.extra.TEXT', `'${text}'`]
  } else if (media !== undefined) {
    const { uri, mime } = findMediaUri(media)
    extras = ['-t', mime, '--eu', 'android.intent.extra.STREAM', uri]
  } else {
    throw new Error('text or media is required')
  }
  return amStart([
    '-a',
    'android.intent.action.SEND',
    ...extras,
    '-n',
    `${appId}/io.twentysixty.mobileagent.MainActivity`,
  ])
}

const view = ({ appId, link }) => {
  if (!APP_IDS.has(appId)) throw new Error(`unknown app ${appId}`)
  if (!/^[\w:/?=.&%-]+$/.test(link)) throw new Error('link has unsafe characters')
  return amStart(['-a', 'android.intent.action.VIEW', '-d', `'${link}'`, '-p', appId])
}

const readBody = async (req) => {
  let body = ''
  for await (const chunk of req) body += chunk
  return JSON.parse(body || '{}')
}

createServer(async (req, res) => {
  try {
    const route = { '/share': share, '/view': view }[req.url]
    if (req.method !== 'POST' || !route) throw new Error(`no route ${req.method} ${req.url}`)
    const output = route(await readBody(req))
    res.writeHead(200).end(output)
  } catch (error) {
    console.error(error)
    res.writeHead(400).end(String(error))
  }
}).listen(PORT, '127.0.0.1', () => console.log(`adb helper on ${PORT}`))
