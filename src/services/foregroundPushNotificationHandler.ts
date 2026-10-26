import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import AgentSingleton from './AgentSingleton'
import { reconnectMediator } from './agent/reconnectMediator'

// Pushes for messages queued while the socket reconnected arrive after the new socket is already live
const PUSH_STALE_MS = 5_000
const CLOCK_SKEW_MS = 1_000
const DAY_MS = 86_400_000

// The mediator pushes only when it has no live session for us, so a push in the foreground means live mode is lost
export function foregroundPushNotificationHandler(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
  const agent = AgentSingleton.instance.getMobileAgent()
  if (!agent?.isInitialized) return
  reconnectMediator(agent, 'push received in the foreground', openedBefore(remoteMessage.sentTime, Date.now()))
}

// iOS has no sentTime for API sends (console sends carry it in seconds), so fall back to a fixed window
function openedBefore(sentTime: number | undefined, now: number): number {
  if (typeof sentTime !== 'number' || sentTime < now - DAY_MS) return now - PUSH_STALE_MS
  return Math.min(sentTime, now) - CLOCK_SKEW_MS
}
