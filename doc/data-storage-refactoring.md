# Data Storage Refactoring Proposal

## 1. Problem Statement

The application currently uses a fragmented data storage architecture:

| Current Store | Technology | Purpose |
|---|---|---|
| `wallet/afj.sqlite` | Credo Askar | Crypto keys + Credo internal records |
| `wallet/main.realm` | Realm (abandoned) | Chat threads, entries, upload tasks, cache |
| Job Queue SQLite | react-native-job-queue (abandoned) | Outbound message queue |
| `config.json` | Plain JSON file | Encryption keys, parental control settings |
| AsyncStorage | @react-native-async-storage | Non-sensitive preferences |

Additionally, **UX-related data is stored within Credo's internal records** via metadata and tags, tightly coupling app display logic to Credo's protocol state.

### Goals

1. **Eliminate abandoned dependencies**: Realm, react-native-job-queue
2. **Consolidate storage** into fewer, well-defined stores
3. **Decouple UX state from Credo records**: protocol records should hold only protocol state
4. **Maintain performance** critical for an IM application
5. **Enable reactivity** without holding all records in React state

---

## 2. Proposed Architecture

| New Store | Technology | Purpose |
|---|---|---|
| `wallet/afj.sqlite` | Credo Askar (unchanged) | Crypto keys + Credo internal records (protocol state only) |
| `wallet/app.sqlite` | op-sqlite + Drizzle ORM (encrypted) | All app-level data: chats, contacts UX state, media transfers, queue |
| Platform Keychain | react-native-keychain | Sensitive keys (Askar wallet key, app DB encryption key, backup key) |
| MMKV | react-native-mmkv | Non-sensitive preferences (developer mode, screen lock timeout, etc.) |

### Key Decisions

- **op-sqlite** over expo-sqlite or react-native-sqlite-storage: synchronous API, WAL mode, SQLCipher support, `updateHook` for reactivity
- **Drizzle ORM**: type-safe schema, compile-time checked queries, migration support, already used by Credo 0.7+
- **MMKV** over AsyncStorage: synchronous, ~30x faster, small key-value store
- **Platform Keychain**: OS-level secure storage for encryption keys (replaces `config.json`)

---

## 3. UX Data Currently Stored on Credo Records

### 3.1 Connection Record Tags

| Tag | Purpose | File |
|---|---|---|
| `blocked` | Block/unblock state | `src/utils/connectionUtils.ts` |
| `lastTimeProfileSent` | Timestamp for profile send throttling | `src/utils/connectionUtils.ts` |
| `lastTimeProfileReceived` | Timestamp for profile freshness | `src/utils/connectionUtils.ts` |
| `parentConnectionId` | Connection hierarchy | `src/hooks/agent/ConnectionsProvider.tsx` |
| `connectionTypes` | Type classification (`peer`/`service`) | `src/utils/connectionUtils.ts` |

### 3.2 Connection Record Metadata

| Metadata Key | Purpose | File |
|---|---|---|
| `features-protocol` | Protocol disclosure objects (drives UI for capabilities) | `src/hooks/agent/connections/subscribeToAgentConnectionEvents.ts` |

### 3.3 Connection Record Fields (written by app)

| Field | Purpose | File |
|---|---|---|
| `connection.alias` | Display name from service info | `src/hooks/useFetchServiceInfo.ts` |
| `connection.imageUrl` | Logo URL from service info | `src/hooks/useFetchServiceInfo.ts` |

### 3.4 Media Sharing Record Metadata

| Metadata Key | Purpose | File |
|---|---|---|
| `localFilePath` | Local filesystem path | `src/hooks/agent/FileUploadDownloadProvider.tsx` |
| `localPreviewFilePath` | Preview thumbnail path | `src/hooks/agent/FileUploadDownloadProvider.tsx` |
| `mediaDownloadState` | Download progress state | `src/hooks/agent/FileUploadDownloadProvider.tsx` |
| `mediaDownloadProgress` | Download percentage | `src/hooks/agent/FileUploadDownloadProvider.tsx` |
| `mediaUploadState` | Upload progress state | `src/hooks/agent/FileUploadDownloadProvider.tsx` |
| `mediaUploadProgress` | Upload percentage | `src/hooks/agent/FileUploadDownloadProvider.tsx` |
| `waveform` | Audio waveform data for display | `src/hooks/agent/FileUploadDownloadProvider.tsx` |

### 3.5 Credential/Proof Exchange Metadata

| Metadata Key | Record Type | Contents | File |
|---|---|---|---|
| `_2060/credentialDisplayMetadata` | DidCommCredentialExchangeRecord / W3cCredentialRecord | issuedAt, issuerId, issuerName, issuerStatus, issuerLogoUrl, schemaName | `src/services/agent/RecordMetadata.ts` |
| `_2060/presentationDisplayMetadata` | DidCommProofExchangeRecord | Credential types/IDs presented | `src/services/agent/RecordMetadata.ts` |

### 3.6 Credo Internal Cache

| Data | Purpose | File |
|---|---|---|
| `ServiceInfo` objects keyed by DID | Trust resolution results | `src/services/agent/cache.ts` |

---

## 4. App SQLite Schema

### 4.1 `contacts`

Replaces: connection tags, connection fields (`alias`, `imageUrl`), and `ConnectionsProvider` in-memory state.

```sql
CREATE TABLE contacts (
  connection_id     TEXT PRIMARY KEY,
  display_name      TEXT,
  display_picture   TEXT,
  blocked           INTEGER DEFAULT 0,
  parent_connection_id TEXT,
  connection_type   TEXT,   -- 'peer' | 'service'
  is_ready          INTEGER DEFAULT 0,
  is_terminated     INTEGER DEFAULT 0,
  last_time_profile_sent     INTEGER,
  last_time_profile_received INTEGER,
  invitation_did    TEXT,
  created_at        INTEGER NOT NULL
);

CREATE INDEX contacts_parent_idx ON contacts(parent_connection_id);
CREATE INDEX contacts_type_idx ON contacts(connection_type);
```

### 4.2 `contact_capabilities`

Replaces: `features-protocol` metadata on connection records.

```sql
CREATE TABLE contact_capabilities (
  connection_id              TEXT PRIMARY KEY,
  supports_media_sharing     INTEGER DEFAULT 0,
  supports_message_receipts  INTEGER DEFAULT 0,
  supports_message_reactions INTEGER DEFAULT 0,
  supports_user_profile      INTEGER DEFAULT 0,
  supports_video_calls       INTEGER DEFAULT 0,
  supports_audio_calls       INTEGER DEFAULT 0
);
```

### 4.3 `chat_threads`

Replaces: Realm `ChatThread`.

```sql
CREATE TABLE chat_threads (
  id                    TEXT PRIMARY KEY,
  connection_id         TEXT NOT NULL,
  created_at            INTEGER NOT NULL,
  last_activity_at      INTEGER NOT NULL,
  last_read_at          INTEGER,
  unread_count          INTEGER DEFAULT 0,
  preview               TEXT,
  last_chat_entry_state TEXT,
  topic                 TEXT,
  picture               TEXT,
  archived              INTEGER DEFAULT 0,
  active                INTEGER DEFAULT 1,
  is_service            INTEGER DEFAULT 0,
  parent_id             TEXT,
  last_child_activity_at INTEGER
);

CREATE INDEX threads_connection_idx ON chat_threads(connection_id);
CREATE INDEX threads_activity_idx ON chat_threads(last_activity_at);
CREATE INDEX threads_parent_idx ON chat_threads(parent_id);
```

### 4.4 `chat_entries`

Replaces: Realm `ChatEntry`.

```sql
CREATE TABLE chat_entries (
  id                      TEXT PRIMARY KEY,
  chat_thread_id          TEXT NOT NULL,
  type                    TEXT NOT NULL,
  role                    TEXT NOT NULL,
  state                   TEXT NOT NULL,
  associated_record_id    TEXT,
  associated_message_id   TEXT,
  didcomm_thread_id       TEXT,
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER,
  unread                  INTEGER DEFAULT 0,
  reactions_json          TEXT,
  receipts_json           TEXT,
  metadata_json           TEXT,
  related_entry_props_json TEXT
);

CREATE INDEX entries_thread_created_idx ON chat_entries(chat_thread_id, created_at);
CREATE INDEX entries_assoc_msg_idx ON chat_entries(associated_message_id);
CREATE INDEX entries_assoc_rec_idx ON chat_entries(associated_record_id);
CREATE INDEX entries_didcomm_thread_idx ON chat_entries(didcomm_thread_id);
```

### 4.5 `media_transfers`

Replaces: UX metadata on `DidCommMediaSharingRecord`.

```sql
CREATE TABLE media_transfers (
  media_record_id         TEXT PRIMARY KEY,
  local_file_path         TEXT,
  local_preview_file_path TEXT,
  waveform                TEXT,
  download_state          TEXT DEFAULT 'pending',
  download_progress       INTEGER,
  upload_state            TEXT,
  upload_progress         INTEGER
);
```

### 4.6 `credential_display`

Replaces: `_2060/credentialDisplayMetadata` on credential/W3C records.

```sql
CREATE TABLE credential_display (
  record_id       TEXT PRIMARY KEY,
  issued_at       INTEGER,
  issuer_id       TEXT,
  issuer_name     TEXT,
  issuer_status   TEXT,
  issuer_logo_url TEXT,
  schema_name     TEXT
);
```

### 4.7 `service_info_cache`

Replaces: Credo's `CacheModuleConfig.cache` and Realm `CacheRecord`.

```sql
CREATE TABLE service_info_cache (
  did                      TEXT PRIMARY KEY,
  name                     TEXT,
  logo_url                 TEXT,
  description              TEXT,
  status                   TEXT,
  minimum_age_required     INTEGER,
  data_privacy_url         TEXT,
  terms_and_conditions_url TEXT,
  service_provider_json    TEXT,
  last_time_updated        INTEGER
);
```

### 4.8 `upload_tasks`

Replaces: Realm `UploadTask`.

```sql
CREATE TABLE upload_tasks (
  id               TEXT PRIMARY KEY,
  media_record_ids TEXT,   -- JSON array
  state            TEXT NOT NULL,
  created_at       INTEGER NOT NULL
);
```

### 4.9 `action_queue`

Replaces: react-native-job-queue.

```sql
CREATE TABLE action_queue (
  id           TEXT PRIMARY KEY,
  worker_name  TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  priority     INTEGER DEFAULT 0,
  attempts     INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 4,
  created_at   INTEGER NOT NULL,
  next_run_at  INTEGER,
  error        TEXT
);

CREATE INDEX queue_status_idx ON action_queue(status, priority, created_at);
```

---

## 5. Event Bridge Layer

The bridge layer subscribes to Credo events and writes UX-relevant data into App SQLite. It ensures **Credo records remain purely protocol state** while the app reads only from its own database.

### 5.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Credo Agent (Askar SQLite)                                 │
│  Events: MessageProcessed, MessageSent, StateChanged, etc.  │
└───────────────────────────┬─────────────────────────────────┘
                            │ agent.events.on(...)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Event Bridge Layer (src/services/bridge/)                   │
│  - Listens to Credo events                                  │
│  - Extracts UX-relevant data from payloads                  │
│  - Writes to App SQLite via Drizzle                         │
│  - NEVER writes UX data back into Credo records             │
└───────────────────────────┬─────────────────────────────────┘
                            │ db.insert / db.update
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  App SQLite (op-sqlite + Drizzle)                           │
│  Tables: contacts, chat_threads, chat_entries, etc.         │
│  updateHook → Table-level reactivity bus                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ onTableChange callback
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  React UI (hooks: useChatThreads, useContacts, etc.)        │
│  Re-queries only affected tables on change                  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Event → Bridge Function Mapping

| Credo Event | Bridge Function | Target Table |
|---|---|---|
| `DidCommConnectionStateChanged` | `syncContactFromConnection` | `contacts` |
| `DiscoverFeaturesDisclosureReceived` | `syncCapabilitiesFromDisclosure` | `contact_capabilities` |
| `ConnectionProfileUpdated` | `syncContactFromConnection` + `setContactProfileTimestamp` | `contacts` |
| Profile sent (local action) | `setContactProfileTimestamp` | `contacts` |
| Block/unblock (local action) | `setContactBlocked` | `contacts` |
| `DidCommMessageProcessed` | `createChatEntry` | `chat_entries` + `chat_threads` |
| `DidCommMessageSent` | `createChatEntry` / `updateChatEntry` | `chat_entries` + `chat_threads` |
| `MessageReceiptsReceived` | `addReceiptToEntry` | `chat_entries` |
| `MessageReactionsReceived` | `addReactionToEntry` | `chat_entries` |
| `MediaSharingStateChanged` | `createChatEntry` | `chat_entries` |
| `RecordUpdated` (media metadata) | `updateMediaTransfer` | `media_transfers` |
| Media download/upload progress | `updateMediaTransfer` | `media_transfers` |
| Service info fetched | `upsertServiceInfo` | `service_info_cache` + `contacts` |

### 5.3 Connection Bridge (`src/services/bridge/connectionBridge.ts`)

```typescript
import { AgentContext } from '@credo-ts/core'
import { DidCommConnectionRecord } from '@credo-ts/didcomm'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { contacts, contactCapabilities } from '../db/schema'

/**
 * Extracts UX-relevant data from a DidCommConnectionRecord and upserts
 * it into the `contacts` table. The connection record itself is NOT modified.
 */
export function syncContactFromConnection(connection: DidCommConnectionRecord) {
  const db = getDb()

  const displayName = connection.alias || connection.theirLabel || ''
  const displayPicture = connection.imageUrl || ''
  const isService = connection.invitationDid !== undefined &&
    !connection.invitationDid.startsWith('did:peer')
  const isTerminated = connection.isReady &&
    (connection.theirDid === undefined || connection.did === undefined)

  db.insert(contacts)
    .values({
      connectionId: connection.id,
      displayName,
      displayPicture,
      blocked: false,
      connectionType: isService ? 'service' : 'peer',
      isReady: connection.isReady,
      isTerminated,
      invitationDid: connection.invitationDid,
      createdAt: connection.createdAt.getTime(),
    })
    .onConflictDoUpdate({
      target: contacts.connectionId,
      set: { displayName, displayPicture, isReady: connection.isReady, isTerminated },
    })
    .run()
}

/**
 * Extracts supported protocol features from disclosure and writes boolean
 * flags into `contact_capabilities`.
 */
export function syncCapabilitiesFromDisclosure(
  connectionId: string,
  protocolUris: string[]
) {
  const db = getDb()
  const has = (uri: string) => protocolUris.includes(uri)

  db.insert(contactCapabilities)
    .values({
      connectionId,
      supportsMediaSharing: has('https://didcomm.org/media-sharing/1.0'),
      supportsMessageReceipts: has('https://didcomm.org/receipts/1.0'),
      supportsMessageReactions: has('https://didcomm.org/reactions/1.0'),
      supportsUserProfile: has('https://didcomm.org/user-profile/1.0'),
      supportsVideoCalls: false, // computed from roles in full implementation
      supportsAudioCalls: false,
    })
    .onConflictDoUpdate({ target: contactCapabilities.connectionId, set: { /* ... */ } })
    .run()
}

export function setContactBlocked(connectionId: string, blocked: boolean) {
  getDb().update(contacts).set({ blocked }).where(eq(contacts.connectionId, connectionId)).run()
}

export function setContactProfileTimestamp(
  connectionId: string,
  field: 'lastTimeProfileSent' | 'lastTimeProfileReceived',
  timestamp: number
) {
  getDb().update(contacts).set({ [field]: timestamp })
    .where(eq(contacts.connectionId, connectionId)).run()
}
```

### 5.4 Media Bridge (`src/services/bridge/mediaBridge.ts`)

```typescript
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { mediaTransfers } from '../db/schema'

/**
 * Replaces: agent.modules.media.setMetadata(id, key, value)
 * All callers now use this function to update media UX state.
 */
export function updateMediaTransfer(
  mediaRecordId: string,
  data: Partial<{
    localFilePath: string | null
    localPreviewFilePath: string | null
    waveform: string | null
    downloadState: string
    downloadProgress: number | null
    uploadState: string | null
    uploadProgress: number | null
  }>
) {
  const db = getDb()
  db.insert(mediaTransfers)
    .values({ mediaRecordId, ...data })
    .onConflictDoUpdate({ target: mediaTransfers.mediaRecordId, set: data })
    .run()
}

export function getMediaTransferState(mediaRecordId: string) {
  return getDb().select().from(mediaTransfers)
    .where(eq(mediaTransfers.mediaRecordId, mediaRecordId)).get()
}
```

### 5.5 Chat Bridge (`src/services/bridge/chatBridge.ts`)

```typescript
import { utils } from '@credo-ts/core'
import { eq, and, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { chatThreads, chatEntries } from '../db/schema'

export function findOrCreateThread(connectionId: string, options: {
  isService: boolean; topic?: string; picture?: string; parentId?: string
}) {
  const db = getDb()
  const existing = db.select().from(chatThreads)
    .where(eq(chatThreads.connectionId, connectionId)).get()
  if (existing) return existing

  const now = Date.now()
  const id = utils.uuid()
  db.insert(chatThreads).values({
    id, connectionId, createdAt: now, lastActivityAt: now,
    isService: options.isService, topic: options.topic,
    picture: options.picture, parentId: options.parentId,
  }).run()
  return db.select().from(chatThreads).where(eq(chatThreads.id, id)).get()!
}

export function updateThread(threadId: string, data: Record<string, unknown>) {
  getDb().update(chatThreads).set(data).where(eq(chatThreads.id, threadId)).run()
}

export function addUnread(threadId: string, count: number) {
  getDb().update(chatThreads)
    .set({ unreadCount: sql`${chatThreads.unreadCount} + ${count}` })
    .where(eq(chatThreads.id, threadId)).run()
}

export function createChatEntry(params: {
  chatThreadId: string; type: string; role: string; state: string;
  associatedRecordId?: string; associatedMessageId?: string;
  didcommThreadId?: string; createdAt?: number; unread?: boolean;
  metadataJson?: string; relatedEntryPropsJson?: string;
}) {
  const db = getDb()
  const id = utils.uuid()
  const createdAt = params.createdAt ?? Date.now()
  db.insert(chatEntries).values({ id, ...params, createdAt,
    unread: params.unread ?? (params.role === 'receiver'),
  }).run()
  // Update thread activity
  updateThread(params.chatThreadId, { lastActivityAt: createdAt, lastChatEntryState: params.state })
  return db.select().from(chatEntries).where(eq(chatEntries.id, id)).get()!
}

export function updateChatEntry(entryId: string, data: Record<string, unknown>) {
  getDb().update(chatEntries).set({ ...data, updatedAt: Date.now() })
    .where(eq(chatEntries.id, entryId)).run()
}

export function findEntriesByAssociatedRecordId(recordId: string, type?: string) {
  const conditions = type
    ? and(eq(chatEntries.associatedRecordId, recordId), eq(chatEntries.type, type))
    : eq(chatEntries.associatedRecordId, recordId)
  return getDb().select().from(chatEntries).where(conditions).all()
}

export function findEntriesByAssociatedMessageId(messageId: string) {
  return getDb().select().from(chatEntries)
    .where(eq(chatEntries.associatedMessageId, messageId)).all()
}
```

### 5.6 Master Subscription (`src/services/bridge/index.ts`)

```typescript
import { MobileAgent } from '../agent'
import { subscribeConnectionBridge } from './connectionBridge'
import { subscribeMediaBridge } from './mediaBridge'

/**
 * Single entry point: subscribes all bridges to Credo events.
 * Called once after agent + app DB are both initialized.
 */
export function subscribeAllBridges(agent: MobileAgent) {
  const unsubConnection = subscribeConnectionBridge(agent.context)
  const unsubMedia = subscribeMediaBridge(agent)
  return () => { unsubConnection(); unsubMedia() }
}
```

---

## 6. Reactivity System

### 6.1 Database Setup

```typescript
import { open } from '@op-engineering/op-sqlite'
import { drizzle } from 'drizzle-orm/op-sqlite'
import * as schema from './schema'

export function openAppDatabase(encryptionKey: string) {
  const rawDb = open({ name: 'app.sqlite', location: 'wallet', encryptionKey })
  rawDb.execute('PRAGMA journal_mode = WAL')
  rawDb.execute('PRAGMA synchronous = NORMAL')
  return { db: drizzle(rawDb, { schema }), rawDb }
}
```

### 6.2 Update Hook → Table Change Bus

```typescript
type TableChangeCallback = () => void
const listeners = new Map<string, Set<TableChangeCallback>>()

export function setupUpdateHook(rawDb: DB) {
  rawDb.updateHook(({ table }) => {
    const cbs = listeners.get(table)
    if (cbs) for (const cb of cbs) cb()
  })
}

export function onTableChange(table: string, cb: TableChangeCallback): () => void {
  if (!listeners.has(table)) listeners.set(table, new Set())
  listeners.get(table)!.add(cb)
  return () => listeners.get(table)!.delete(cb)
}
```

### 6.3 React Hooks

```typescript
// useChatThreads — replaces Realm live queries
function useChatThreads(filters: { topic?: string; category?: string }) {
  const [threads, setThreads] = useState([])

  const query = useCallback(() => {
    const result = db.select().from(chatThreads)
      .where(/* build conditions from filters */)
      .orderBy(desc(chatThreads.lastActivityAt)).all()
    setThreads(result)
  }, [filters])

  useEffect(() => {
    query()
    return onTableChange('chat_threads', query)
  }, [query])

  return threads
}

// useContact — replaces reading tags/metadata from DidCommConnectionRecord
function useContact(connectionId: string) {
  const [contact, setContact] = useState()

  const query = useCallback(() => {
    setContact(db.select().from(contacts)
      .where(eq(contacts.connectionId, connectionId)).get())
  }, [connectionId])

  useEffect(() => {
    query()
    return onTableChange('contacts', query)
  }, [query])

  return contact
}
```

---

## 7. Migration from Current Code Patterns

### 7.1 Connection Tags → `contacts` Table

**Before:**
```typescript
// Read
const isConnectionBlocked = connection.getTag('blocked') === true
const profile = connection.getTag('lastTimeProfileSent')

// Write
connection.setTag('blocked', true)
await connectionService.update(context, connection)
```

**After:**
```typescript
// Read
const { contact } = useContact(connectionId)
const isConnectionBlocked = contact?.blocked

// Write
setContactBlocked(connectionId, true)
// No Credo record update needed for UX state
// Note: mediation keylist update still uses agent API directly
```

### 7.2 Connection Metadata → `contact_capabilities` Table

**Before:**
```typescript
const supportsMedia = connection.metadata.get('features-protocol')?.[protocolUri] !== undefined
```

**After:**
```typescript
const { capabilities } = useContact(connectionId)
const supportsMedia = capabilities?.supportsMediaSharing
```

### 7.3 Media Metadata → `media_transfers` Table

**Before:**
```typescript
await agent.modules.media.setMetadata(recordId, 'localFilePath', path)
await agent.modules.media.setMetadata(recordId, 'mediaDownloadState', 'done')
// Read in handler:
const path = record.metadata.get('localFilePath') as string
```

**After:**
```typescript
updateMediaTransfer(recordId, { localFilePath: path, downloadState: 'done' })
// Read:
const transfer = getMediaTransferState(recordId)
```

### 7.4 Credential Display Metadata → `credential_display` Table

**Before:**
```typescript
setDidCommCredentialMetadata(record, { issuedAt, issuerId, ... })
await agent.didcomm.credentials.update(record)
// Read:
const metadata = getDidCommCredentialDisplayMetadata(record)
```

**After:**
```typescript
db.insert(credentialDisplay).values({ recordId: record.id, issuedAt, issuerId, ... }).run()
// Read:
const display = db.select().from(credentialDisplay).where(eq(...)).get()
```

### 7.5 ConnectionsProvider Anti-Pattern

**Before** (O(n) memory, all records in React state):
```typescript
const records = await agent.didcomm.connections.getAll()
setState({ records, loading: false })
// Filter in-memory for UI
const filtered = records.filter(c => c.getTag('parentConnectionId') === undefined)
```

**After** (indexed query, only load what screen needs):
```typescript
const peerContacts = db.select().from(contacts)
  .where(and(isNull(contacts.parentConnectionId), eq(contacts.blocked, false)))
  .orderBy(contacts.displayName).all()
```

### 7.6 Chat.tsx Profile Send Check

**Before** (`src/pages/Chat/Chat.tsx:180-191`):
```typescript
const mustSendProfile = isDateGreaterThan(flags.myProfileUpdatedAt, new Date(flags.lastTimeProfileSent))
if (mustSendProfile) {
  setLastTimeProfileSent(connection, agent.context)  // writes tag + updates Credo record
  addAgentActionToQueue({ type: AgentActionType.SendUserProfile, parameters })
}
```

**After:**
```typescript
const { contact } = useContact(connectionId)
const mustSendProfile = contact?.lastTimeProfileSent &&
  isDateGreaterThan(myProfileUpdatedAt, new Date(contact.lastTimeProfileSent))
if (mustSendProfile) {
  setContactProfileTimestamp(connectionId, 'lastTimeProfileSent', Date.now())
  enqueueAction({ type: 'SendUserProfile', parameters })  // uses action_queue table
}
```

---

## 8. Action Queue (replaces react-native-job-queue)

### Design

- Backed by `action_queue` table with status index
- **Event-driven dispatch**: `updateHook` on INSERT triggers immediate processing (zero latency)
- Single-threaded processor (concurrency = 1)
- Exponential backoff retry via `next_run_at` column
- Lightweight 5s timer only for retry jobs with a future `next_run_at`
- Retry query (runs on timer only):
  ```sql
  SELECT * FROM action_queue
  WHERE status = 'pending' AND next_run_at IS NOT NULL AND next_run_at <= ?
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  ```

### API

```typescript
export function enqueueAction(params: {
  workerName: string; payload: unknown; priority?: number; maxAttempts?: number
}) {
  getDb().insert(actionQueue).values({
    id: utils.uuid(),
    workerName: params.workerName,
    payloadJson: JSON.stringify(params.payload),
    priority: params.priority ?? 0,
    maxAttempts: params.maxAttempts ?? 4,
    createdAt: Date.now(),
  }).run()
}

export function markActionDone(id: string) {
  getDb().update(actionQueue).set({ status: 'done' }).where(eq(actionQueue.id, id)).run()
}

export function markActionFailed(id: string, error: string, nextRunAt?: number) {
  getDb().update(actionQueue).set({
    status: nextRunAt ? 'pending' : 'failed',
    error,
    attempts: sql`${actionQueue.attempts} + 1`,
    nextRunAt,
  }).where(eq(actionQueue.id, id)).run()
}
```

---

## 9. Key & Preference Migration

### 9.1 Platform Keychain

All keys are stored with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` accessibility, which provides:
- **Hardware-backed storage** (Secure Enclave on iOS, TEE/StrongBox on Android)
- **Background access** after the user unlocks the device once since boot (required for push notification handling)
- **Non-exportable** keys (not included in device backups, preventing key leakage)
- **No biometric prompt** on each access (unlike `BIOMETRY_ANY` which would block background processes)

> After a device reboot, the app cannot decrypt its databases until the user unlocks the
> device for the first time. This is expected — push notifications received before that first
> unlock are queued by the OS and processed once the keys become available.

| Key | Current Location | Migration |
|---|---|---|
| `AfjWallet` (Askar wallet key) | `config.json` → `keys.AfjWallet` | `Keychain.setGenericPassword('AfjWallet', hexKey, { service: 'AfjWallet', accessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY })` |
| `RealmMain` → `AppSqlite` (app DB key) | `config.json` → `keys.RealmMain` | `Keychain.setGenericPassword('AppSqlite', hexKey, { service: 'AppSqlite', accessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY })` |
| `Backup` (backup encryption key) | `config.json` → `keys.Backup` | `Keychain.setGenericPassword('Backup', hexKey, { service: 'Backup', accessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY })` |

### 9.2 MMKV

| Key | Current Location |
|---|---|
| `LOGS_ENABLED_PERSIST_KEY` | AsyncStorage |
| `GOOGLE_ACCOUNT_BACKUP_PERSIST_KEY` | AsyncStorage |
| `BACKUP_INCLUDES_MEDIA_PERSIST_KEY` | AsyncStorage |
| `AUTOMATIC_MEDIA_DOWNLOAD_VALUES_PERSIST_KEY` | AsyncStorage |
| `DEVELOPER_MODE_ENABLED_PERSIST_KEY` | AsyncStorage |
| `DEV_ENVS_PERSIST_KEY` | AsyncStorage |
| `CUSTOM_DEV_ENVS_PERSIST_KEY` | AsyncStorage |
| `SCREEN_LOCK_TIMEOUT_PERSIST_KEY` | AsyncStorage |
| `SCREEN_LOCK_ENABLED_PERSIST_KEY` | AsyncStorage |
| `USER_INVITATION_OUT_OF_BAND_RECORD_ID` | AsyncStorage |
| Parental control settings | `config.json` → `parentalControl` |

---

## 10. Migration Strategy

### Overview

Everything ships in a **single release**. The phases below are **development milestones**
(separate PRs/branches), not separate app versions. This avoids maintaining hybrid code paths
(dual-write adapters, fallback reads) across releases, which would make the codebase harder to
reason about and debug.

At runtime, existing users run a **one-time startup migration** that executes all steps before
the app becomes usable. The migration uses a **versioned progress flag** in MMKV so that if the
app crashes or is killed mid-migration, it resumes from the last completed step on next launch.
Old data files (`main.realm`, `config.json`) are kept on disk until the migration is fully
verified, acting as a safety net.

New installs skip the migration entirely — they start directly with the new architecture.

```
┌──────────────────────────────────────────────────────────┐
│  App Launch (existing user)                              │
│  ├─ Read migration version from MMKV (default: 0)       │
│  ├─ If version < CURRENT_MIGRATION_VERSION:              │
│  │   ├─ Show migration progress screen                  │
│  │   ├─ Run pending steps sequentially                  │
│  │   ├─ Update version in MMKV after each step          │
│  │   ├─ Verify data integrity                           │
│  │   └─ On failure: keep old files, show retry option   │
│  └─ Continue normal app startup (new stores only)       │
└──────────────────────────────────────────────────────────┘
```

### Phase 1: Infrastructure (no user-facing changes)

**Goal**: Add new dependencies and create the App SQLite database alongside the existing stores.
Nothing is removed yet — this is purely additive.

#### Steps

1. **Add dependencies** to `package.json`:
   - `@op-engineering/op-sqlite` (with SQLCipher)
   - `drizzle-orm` + `drizzle-kit` (dev)
   - `react-native-keychain`
   - `react-native-mmkv`

2. **Create schema file** (`src/services/db/schema.ts`) with all Drizzle table definitions from Section 4.

3. **Implement database setup** (`src/services/db/index.ts`):
   - `openAppDatabase(encryptionKey)` → creates/opens `wallet/app.sqlite`
   - WAL mode, synchronous = NORMAL
   - Run Drizzle migrations to create tables

4. **Implement reactivity bus** (`src/services/db/reactivity.ts`):
   - `setupUpdateHook()` — registers `rawDb.updateHook`
   - `onTableChange(table, callback)` — subscribe/unsubscribe per table

5. **Integrate into app startup** (`useWallet.ts`):
   - Replace `openRealm()` with `openAppDatabase(key)`
   - Realm is only opened temporarily during migration (Phase 4), then closed and never used again

#### Deliverable

App SQLite infrastructure ready. Schema, reactivity bus, and database lifecycle in place.
All subsequent phases build on this foundation.

---

### Phase 2: Keys & Preferences Migration

**Goal**: Move sensitive keys to Platform Keychain, non-sensitive preferences to MMKV.

#### 2.1 Encryption Keys (`config.json` → Platform Keychain)

Currently keys are stored in `config.json` via `src/services/keys/index.ts`:
- `KeyChainService.AfjWallet` → Askar wallet encryption key
- `KeyChainService.RealmMain` → Realm encryption key (becomes App SQLite key)
- `KeyChainService.Backup` → Backup encryption key

**Migration logic** (runs once at startup):

```typescript
import Keychain from 'react-native-keychain'

const KEYCHAIN_OPTIONS = {
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
}

async function migrateKeysToKeychain() {
  for (const service of [KeyChainService.AfjWallet, KeyChainService.RealmMain, KeyChainService.Backup]) {
    // Try reading from old config.json
    const existingKey = await readKeyFromConfigJson(service)
    if (existingKey) {
      // Store in platform keychain with hardware-backed, background-accessible protection
      await Keychain.setGenericPassword(service, existingKey, { service, ...KEYCHAIN_OPTIONS })
    }
  }
}
```

> **Why `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`?**
> The app must open the wallet in the background when a push notification arrives. This
> requires the encryption keys to be accessible without user interaction. This accessibility
> level allows that as long as the user has unlocked the device at least once since boot,
> while still providing hardware-backed protection and preventing key export via backups.

**Updated `retrieveEncryptedKey`** (reads from keychain only after migration):

```typescript
export async function retrieveEncryptedKey(service: KeyChainService) {
  const keychainResult = await Keychain.getGenericPassword({ service })
  if (keychainResult) return keychainResult.password
  return undefined
}
```

> **Note**: The migration function (`migrateKeysToKeychain`) reads from `config.json` and writes
> to the keychain. After migration, `config.json` is kept on disk as a safety net but is never
> read in normal app operation.

#### 2.2 Parental Control Settings (`config.json` → MMKV)

Currently in `config.json` under the `parentalControl` key (see `src/services/config/index.ts`).

```typescript
async function migrateParentalControlToMmkv() {
  const config = await readFile(CONFIG_FILE_PATH)
  const configJson = JSON.parse(config)
  if (configJson.parentalControl) {
    for (const [key, value] of Object.entries(configJson.parentalControl)) {
      mmkv.set(`parentalControl.${key}`, value as string)
    }
  }
}
```

#### 2.3 Non-Sensitive Preferences (AsyncStorage → MMKV)

All keys from `src/services/localStorage/index.ts`:

```typescript
const ASYNC_STORAGE_KEYS = [
  'logsEnabled',
  'googleAccountBackup',
  'backupIncludesMedia',
  'automaticMediaDownloadValues',
  'developerModeEnabled',
  'developmentEnvironments',
  'customDevelopmentEnvironments',
  'screenLockTimeout',
  'screenLockEnabled',
  'userInvitationOutOfBandRecordId',
]

async function migrateAsyncStorageToMmkv() {
  for (const key of ASYNC_STORAGE_KEYS) {
    const value = await AsyncStorage.getItem(key)
    if (value !== null) {
      mmkv.set(key, value)
    }
  }
}
```

**Updated `getStorageData` / `setStorageData`** (MMKV only, synchronous):

```typescript
export function getStorageData(key: string): unknown | null {
  const value = mmkv.getString(key)
  if (value !== undefined) return JSON.parse(value)
  return null
}

export function setStorageData(key: string, value: unknown): boolean {
  mmkv.set(key, JSON.stringify(value))
  return true
}
```

#### Deliverable

Keys in Platform Keychain, preferences in MMKV. Old files (`config.json`, AsyncStorage) kept
on disk as safety net but never read in normal operation.

---

### Phase 3: Action Queue Migration

**Goal**: Replace `react-native-job-queue` with the `action_queue` table. This is done early
because the job queue is self-contained and has no data to migrate (jobs are transient).

#### Steps

1. **Implement action queue processor** (`src/services/actionQueue/index.ts`):
   - `enqueueAction(params)` → inserts into `action_queue` table
   - Event-driven processing via `updateHook` on INSERT (zero-latency dispatch)
   - Lightweight 5s timer for retry jobs with future `next_run_at`
   - Exponential backoff: `next_run_at = now + (2^attempts * 1000)`
   - Single-threaded processing (concurrency = 1), matching current behavior

2. **Port worker logic** from `AgentActionQueueSingleton`:
   - Current workers: `AgentAction`, `RetryAgentAction`
   - Map each `AgentActionType` to its executor (reuse `AgentActionExecuterMap.ts`)
   - On success: mark `status = 'done'`, delete row
   - On failure: increment `attempts`, set `next_run_at` or mark `status = 'failed'`

3. **Replace `AgentActionQueueSingleton`**:
   - `addJob(payload)` → `enqueueAction({ workerName: 'AgentAction', payload })`
   - `addRetryJob(payload)` → `enqueueAction({ workerName: 'RetryAgentAction', payload })`
   - Remove `queue.configure()`, `queue.addWorker()`, etc.

4. **Remove `react-native-job-queue`** from `package.json` and delete its SQLite database file.

#### Why early?

- No persistent data to migrate (jobs live for minutes)
- Any in-flight jobs at upgrade time can simply be re-enqueued on next app start
- Removes an abandoned dependency immediately

#### Deliverable

Outbound message queue powered by `action_queue` table. `react-native-job-queue` fully removed.

---

### Phase 4: Chat Data Migration (Realm → SQLite)

**Goal**: Migrate `ChatThread`, `ChatEntry`, `UploadTask`, and `CacheRecord` from Realm to App SQLite.
This is the largest and most critical phase.

#### 4.1 One-Time Data Migration

Since everything ships in a single release, there is no dual-write period. The migration opens
Realm read-only, copies all data to App SQLite, verifies integrity, then closes Realm permanently.
The new code only reads/writes App SQLite.

```typescript
async function migrateRealmToSqlite(realm: Realm, db: DrizzleDb) {
  // --- Chat Threads ---
  const threads = realm.objects(ChatThread)
  for (const thread of threads) {
    db.insert(chatThreads).values({
      id: thread.id,
      connectionId: thread.connectionId,
      createdAt: thread.createdAt.getTime(),
      lastActivityAt: thread.lastActivityAt.getTime(),
      lastReadAt: thread.lastReadAt?.getTime(),
      unreadCount: thread.unreadCount,
      preview: thread.preview,
      lastChatEntryState: thread.lastChatEntryState,
      topic: thread.topic,
      picture: thread.picture,
      archived: thread.archived,
      active: thread.active,
      isService: thread.isService,
      parentId: thread.parentId,
      lastChildActivityAt: thread.lastChildActivityAt?.getTime(),
    }).onConflictDoNothing().run()
  }

  // --- Chat Entries ---
  const entries = realm.objects(ChatEntry)
  for (const entry of entries) {
    db.insert(chatEntries).values({
      id: entry.id,
      chatThreadId: entry.chatThreadId,
      type: entry.type,
      role: entry.role,
      state: entry.state,
      associatedRecordId: entry.associatedRecordId,
      associatedMessageId: entry.associatedMessageId,
      didcommThreadId: entry.didcommThreadId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      unread: entry.unread,
      reactionsJson: JSON.stringify(entry.reactions ?? []),
      receiptsJson: JSON.stringify(entry.receipts ?? []),
      metadataJson: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
      relatedEntryPropsJson: entry.relatedEntryProps ? JSON.stringify(entry.relatedEntryProps) : undefined,
    }).onConflictDoNothing().run()
  }

  // --- Upload Tasks ---
  const tasks = realm.objects(UploadTask)
  for (const task of tasks) {
    db.insert(uploadTasks).values({
      id: task.fileId,
      mediaRecordIds: JSON.stringify([...task.mediaRecordIds]),
      state: task.state,
      createdAt: Date.now(),
    }).onConflictDoNothing().run()
  }

  // --- Cache Records ---
  const cacheRecords = realm.objects(CacheRecord)
  for (const record of cacheRecords) {
    db.insert(serviceInfoCache).values({
      did: record.url,
      name: '',  // will be populated on next fetch
      lastTimeUpdated: record.lastModified,
    }).onConflictDoNothing().run()
  }
}
```

**Performance**: For a typical user with ~100 threads and ~10,000 entries, this migration takes
< 2 seconds. For power users (50k+ entries), we batch inserts in transactions of 500 rows.

#### 4.2 Verification Step

After migration, verify data integrity:

```typescript
function verifyMigration(realm: Realm, db: DrizzleDb): boolean {
  const realmThreadCount = realm.objects(ChatThread).length
  const sqliteThreadCount = db.select({ count: sql`count(*)` }).from(chatThreads).get()

  const realmEntryCount = realm.objects(ChatEntry).length
  const sqliteEntryCount = db.select({ count: sql`count(*)` }).from(chatEntries).get()

  return realmThreadCount === sqliteThreadCount?.count &&
         realmEntryCount === sqliteEntryCount?.count
}
```

If verification fails, the migration flag is NOT advanced and the app shows an error with a
retry option. Old Realm data remains intact on disk.

#### 4.3 Code Changes (all in the same release)

All Realm references are replaced with App SQLite in this release. There is no intermediate
state where both stores are active in production code:

1. Replace `useLocalRealm()` calls with `useAppDb()` in all components
2. Replace Realm query hooks (`useChatThreads`, `useChatEntries`) with SQLite-based hooks
3. Replace `RealmProvider` with `AppDbProvider`

**Key files to update** (40 files reference Realm directly):

| Layer | Files | Change |
|---|---|---|
| Providers | `RealmProvider.tsx`, `ChatsProvider.tsx` | Replace with `AppDbProvider`, remove Realm context |
| Hooks | `useChatThreads.ts`, `useChatEntries.ts` | Query App SQLite instead of Realm |
| Services | `ChatEntryService.ts`, `ChatThreadService.ts` | All CRUD ops use Drizzle |
| Event handlers | `subscribeToAgentChatEvents.ts`, all `recordChangeHandlers/*` | Accept `db` instead of `realm` |
| Pages | `Chat.tsx`, `Settings.tsx`, `Developer.tsx`, etc. | Replace `useLocalRealm()` with `useAppDb()` |
| Backup | `useBuildBackup.ts`, `useRestoreBackup.ts` | See Phase 4.4 |
| Other | `useFetchServiceInfo.ts`, `useChatActions.ts`, `FileUploadDownloadProvider.tsx` | Replace realm refs |

#### 4.4 Backup & Restore Updates

The backup system currently includes `main.realm` in the backup zip. This must be updated to
export/import the App SQLite database instead.

**Current backup flow** (`useBuildBackup.ts`):
```
1. Export Askar store → afj.sqlite
2. realm.writeCopyTo → main.realm (encrypted with backup key)
3. Zip media files
4. Create manifest
5. Zip everything
```

**New backup flow**:
```
1. Export Askar store → afj.sqlite (unchanged)
2. Export App SQLite → app.sqlite (encrypted copy with backup key)
3. Zip media files (unchanged)
4. Create manifest with schemaVersion: 2
5. Zip everything
```

Exporting App SQLite for backup:

```typescript
function createChatsBackup(backupKey: string) {
  const rawDb = getRawDb()
  // SQLCipher allows re-encrypting to a different key for the backup copy
  rawDb.execute(`ATTACH DATABASE '${SQLITE_BACKUP_FILE_PATH}' AS backup KEY '${backupKey}'`)
  rawDb.execute("SELECT sqlcipher_export('backup')")
  rawDb.execute("DETACH DATABASE backup")
}
```

**New restore flow**:

```typescript
async function onSuccessFinish(backupKey: string) {
  const manifest = JSON.parse(await readFile(BACKUP_MANIFEST_FILE_PATH))

  if (manifest.schemaVersion >= 2) {
    // New format: import App SQLite
    importAppSqliteFromBackup(SQLITE_BACKUP_FILE_PATH, backupKey)
  } else {
    // Legacy format: import Realm and migrate
    await importAndOpenRealm(REALM_BACKUP_FILE_PATH, backupKey)
    await migrateRealmToSqlite(realm, db)  // one-time migration of restored data
  }

  await openWallet()
  await handleNotificationsPermission()
}
```

**Backward compatibility**: The restore flow checks `manifest.schemaVersion`:
- `schemaVersion: 1` → legacy backup with `main.realm` → import Realm, then run migration
- `schemaVersion: 2` → new backup with `app.sqlite` → import directly

This ensures users can restore from older backups even after the migration.

#### 4.5 Realm Removal

Since this is a single release, Realm is removed entirely from the codebase:

1. Delete Realm model files: `ChatThread.ts`, `ChatEntry.ts`, `UploadTask.ts`, `CacheRecord.ts`
2. Delete `RealmProvider.tsx`, `RealmSingleton.ts`, `realm.ts`, `realmQueries.ts`
3. Remove `realm` from `package.json`
4. Keep `wallet/main.realm` on disk after migration (safety net); delete it in Phase 7 cleanup

> **Important**: Realm is still needed as a **build dependency** for the migration function
> (`migrateRealmToSqlite`) that reads the old database. This code lives in a dedicated
> `src/services/migration/` module. Once enough time has passed that all users have migrated
> (Phase 7), this module and the Realm dependency are removed entirely.

#### Deliverable

All chat data in App SQLite. Realm used only during one-time migration, never during normal
operation. Backup/restore handles both legacy (`main.realm`) and new (`app.sqlite`) formats.

---

### Phase 5: UX Data Decoupling (Credo records → App SQLite)

**Goal**: Move UX-related data from Credo's connection/credential/media records into App SQLite
tables (`contacts`, `contact_capabilities`, `media_transfers`, `credential_display`).

#### 5.1 One-Time Population of `contacts` Table

On first launch, populate from existing Credo connection records:

```typescript
async function populateContactsFromCredo(agent: MobileAgent) {
  const connections = await agent.didcomm.connections.getAll()
  for (const connection of connections) {
    syncContactFromConnection(connection)  // bridge function from Section 5.3

    // Migrate tags that are currently on the connection record
    const blocked = connection.getTag('blocked') === true
    const lastTimeProfileSent = connection.getTag('lastTimeProfileSent') as string | undefined
    const lastTimeProfileReceived = connection.getTag('lastTimeProfileReceived') as string | undefined
    const parentConnectionId = connection.getTag('parentConnectionId') as string | undefined

    db.update(contacts).set({
      blocked,
      parentConnectionId,
      lastTimeProfileSent: lastTimeProfileSent ? new Date(lastTimeProfileSent).getTime() : undefined,
      lastTimeProfileReceived: lastTimeProfileReceived ? new Date(lastTimeProfileReceived).getTime() : undefined,
    }).where(eq(contacts.connectionId, connection.id)).run()
  }
}
```

#### 5.2 One-Time Population of `contact_capabilities` Table

```typescript
async function populateCapabilitiesFromCredo(agent: MobileAgent) {
  const connections = await agent.didcomm.connections.getAll()
  for (const connection of connections) {
    const featuresProtocol = connection.metadata.get('features-protocol')
    if (featuresProtocol) {
      syncCapabilitiesFromDisclosure(connection.id, Object.keys(featuresProtocol))
    }
  }
}
```

#### 5.3 One-Time Population of `media_transfers` Table

```typescript
async function populateMediaTransfersFromCredo(agent: MobileAgent) {
  const mediaRecords = await agent.modules.media.getAll()
  for (const record of mediaRecords) {
    const localFilePath = record.metadata.get('localFilePath') as string | null
    const localPreviewFilePath = record.metadata.get('localPreviewFilePath') as string | null
    const waveform = record.metadata.get('waveform') as string | null
    const downloadState = record.metadata.get('mediaDownloadState') as string ?? 'done'
    const uploadState = record.metadata.get('mediaUploadState') as string | null

    if (localFilePath || localPreviewFilePath || waveform || downloadState || uploadState) {
      updateMediaTransfer(record.id, {
        localFilePath, localPreviewFilePath, waveform,
        downloadState, uploadState,
        downloadProgress: null, uploadProgress: null,
      })
    }
  }
}
```

#### 5.4 One-Time Population of `credential_display` Table

```typescript
async function populateCredentialDisplayFromCredo(agent: MobileAgent) {
  const exchanges = await agent.didcomm.credentials.getAll()
  for (const exchange of exchanges) {
    const metadata = getDidCommCredentialDisplayMetadata(exchange)
    if (metadata) {
      db.insert(credentialDisplay).values({
        recordId: exchange.id,
        issuedAt: metadata.issuedAt,
        issuerId: metadata.issuerId,
        issuerName: metadata.issuerName,
        issuerStatus: metadata.issuerStatus,
        issuerLogoUrl: metadata.issuerLogoUrl,
        schemaName: metadata.schemaName,
      }).onConflictDoNothing().run()
    }
  }
}
```

#### 5.5 Switch Reads and Writes

1. **Reads**: Replace all `connection.getTag(...)` / `connection.metadata.get(...)` calls in
   `connectionUtils.ts` and UI components with queries to the `contacts` / `contact_capabilities`
   tables (see Section 7 for before/after examples).

2. **Writes**: Replace all `connection.setTag(...)` / `connection.metadata.add(...)` calls with
   bridge function calls (`setContactBlocked`, `setContactProfileTimestamp`,
   `syncCapabilitiesFromDisclosure`, `updateMediaTransfer`).

3. **Keep protocol-critical writes**: `blockConnection` / `unblockConnection` in
   `connectionUtils.ts` must still call `updateConnectionMediationKeylist` (this affects the
   mediator, not just UI). But the `blocked` tag write moves to `setContactBlocked`.

4. **Remove UX metadata** from Credo records: stop writing `features-protocol`,
   `_2060/credentialDisplayMetadata`, `_2060/presentationDisplayMetadata` to Credo records.

#### Deliverable

All UX state lives in App SQLite. Credo records hold only protocol state. `ConnectionsProvider`
no longer loads all records into React state — queries go directly to indexed `contacts` table.

---

### Phase 6: Service Info Cache Migration

**Goal**: Replace both Credo's `CacheModuleConfig.cache` and Realm `CacheRecord` with the
`service_info_cache` table.

#### Steps

1. **Populate `service_info_cache`** from Credo's cache on first launch:

   ```typescript
   async function populateServiceInfoCacheFromCredo(agent: MobileAgent) {
     const connections = await agent.didcomm.connections.getAll()
     for (const connection of connections) {
       if (!connection.invitationDid) continue
       const cached = await getInCacheServiceInfo(connection.invitationDid, agent.context)
       if (cached) {
         db.insert(serviceInfoCache).values({
           did: cached.did,
           name: cached.name,
           logoUrl: cached.logoUrl,
           description: cached.description,
           status: cached.status,
           minimumAgeRequired: cached.minimumAgeRequired,
           dataPrivacyUrl: cached.dataPrivacyUrl,
           termsAndConditionsUrl: cached.termsAndConditionsUrl,
           serviceProviderJson: cached.serviceProvider ? JSON.stringify(cached.serviceProvider) : undefined,
           lastTimeUpdated: cached.lastTimeUpdated,
         }).onConflictDoNothing().run()
       }
     }
   }
   ```

2. **Replace `useFetchServiceInfo`**: read/write from `service_info_cache` table instead of
   Credo's cache API. Remove `useLocalRealm()` dependency from this hook.

3. **Stop using `CacheModuleConfig.cache`** for ServiceInfo (Credo's cache can still be used
   for Credo-internal purposes if needed).

#### Deliverable

Service info caching fully in App SQLite. No more cross-layer dependency on Credo's cache module
for app data.

---

### Phase 7: Cleanup (future separate release)

**Goal**: Remove all deprecated dependencies and dead code. This ships as a **separate release**
after the migration has been stable in production for 2–4 weeks.

#### 7.1 Dependencies to Remove

| Package | Replacement |
|---|---|
| `realm` (20.2.0) | `@op-engineering/op-sqlite` + `drizzle-orm` |
| `react-native-job-queue` (0.5.3) | `action_queue` table |
| `@react-native-async-storage/async-storage` | `react-native-mmkv` |

#### 7.2 Files to Delete

| File | Reason |
|---|---|
| `src/model/ChatThread.ts` | Realm model → replaced by Drizzle schema |
| `src/model/ChatEntry.ts` | Realm model → replaced by Drizzle schema |
| `src/model/UploadTask.ts` | Realm model → replaced by Drizzle schema |
| `src/model/CacheRecord.ts` | Realm model → replaced by Drizzle schema |
| `src/utils/realm.ts` | Realm config |
| `src/utils/realmQueries.ts` | Realm query helpers |
| `src/services/RealmSingleton.ts` | Realm lifecycle manager |
| `src/hooks/providers/RealmProvider.tsx` | Realm React context |
| `src/services/agent/RecordMetadata.ts` | Credo metadata helpers (replaced by `credential_display` table) |

#### 7.3 Code to Remove

- All `connection.setTag(...)` / `connection.getTag(...)` calls for UX data
- All `connection.metadata.add('features-*', ...)` calls
- All `agent.modules.media.setMetadata(...)` calls for UX state
- `config.json` read/write logic in `src/services/keys/index.ts` (after confirming all users migrated)
- AsyncStorage fallback reads in `src/services/localStorage/index.ts`

#### 7.4 Database Files to Clean Up

On first launch after Phase 7:

```typescript
async function cleanupOldDatabaseFiles() {
  // Delete Realm file and its auxiliary files
  await deleteFile(`${walletDirectoryPath}/main.realm`)
  await deleteFile(`${walletDirectoryPath}/main.realm.lock`)
  await deleteFile(`${walletDirectoryPath}/main.realm.management`)

  // Delete react-native-job-queue database
  await deleteFile(`${walletDirectoryPath}/queue.sqlite`)

  // Delete config.json (all data migrated to keychain/MMKV)
  await deleteFile(CONFIG_FILE_PATH)
}
```

#### Deliverable

Clean dependency tree. Single App SQLite database for all app-level data. No dead code or orphaned
files.

---

### Migration Version Tracking

Each step sets a migration version in MMKV. If the app crashes or is killed mid-migration,
it resumes from the last completed step on next launch — no data is re-migrated or lost.

```typescript
const MIGRATION_VERSION_KEY = 'data_migration_version'

enum MigrationVersion {
  Initial = 0,
  KeysAndPreferences = 1,       // Phase 2: keys → keychain, prefs → MMKV
  ChatDataMigrated = 2,         // Phase 4.1: Realm → SQLite data copy
  ChatDataVerified = 3,         // Phase 4.2: integrity check passed
  UxDataPopulated = 4,          // Phase 5: contacts, capabilities, media, credentials
  ServiceInfoCachePopulated = 5, // Phase 6: service info cache
  Done = 6,                      // All runtime migrations complete
}

async function runPendingMigrations(agent: MobileAgent, db: DrizzleDb) {
  const currentVersion = mmkv.getNumber(MIGRATION_VERSION_KEY) ?? MigrationVersion.Initial

  // For new installs, skip everything
  const isNewInstall = !(await existsFile(CONFIG_FILE_PATH)) && !(await existsFile(realmFilePath))
  if (isNewInstall) {
    mmkv.set(MIGRATION_VERSION_KEY, MigrationVersion.Done)
    return
  }

  if (currentVersion < MigrationVersion.KeysAndPreferences) {
    await migrateKeysToKeychain()
    await migrateParentalControlToMmkv()
    await migrateAsyncStorageToMmkv()
    mmkv.set(MIGRATION_VERSION_KEY, MigrationVersion.KeysAndPreferences)
  }

  if (currentVersion < MigrationVersion.ChatDataMigrated) {
    const realm = await openRealmReadOnly()
    await migrateRealmToSqlite(realm, db)
    mmkv.set(MIGRATION_VERSION_KEY, MigrationVersion.ChatDataMigrated)

    if (verifyMigration(realm, db)) {
      mmkv.set(MIGRATION_VERSION_KEY, MigrationVersion.ChatDataVerified)
    } else {
      realm.close()
      throw new MigrationError('Chat data verification failed — will retry on next launch')
    }
    realm.close()
  }

  if (currentVersion < MigrationVersion.UxDataPopulated) {
    await populateContactsFromCredo(agent)
    await populateCapabilitiesFromCredo(agent)
    await populateMediaTransfersFromCredo(agent)
    await populateCredentialDisplayFromCredo(agent)
    mmkv.set(MIGRATION_VERSION_KEY, MigrationVersion.UxDataPopulated)
  }

  if (currentVersion < MigrationVersion.ServiceInfoCachePopulated) {
    await populateServiceInfoCacheFromCredo(agent)
    mmkv.set(MIGRATION_VERSION_KEY, MigrationVersion.ServiceInfoCachePopulated)
  }

  mmkv.set(MIGRATION_VERSION_KEY, MigrationVersion.Done)
}
```

### Error Handling During Migration

If the migration fails at any step:

1. **The version flag is NOT advanced** — the failed step will retry on next app launch
2. **Old data files remain intact** — Realm, config.json, AsyncStorage are never deleted during migration
3. **The user sees a clear error screen** with a "Retry" button (not a crash)
4. **Crash reporting** captures the error for diagnosis

```typescript
try {
  await runPendingMigrations(agent, db)
} catch (error) {
  logError('Migration failed', error)
  // Show migration error screen with retry button
  showMigrationErrorScreen(error, () => runPendingMigrations(agent, db))
}
```

### Rollback Strategy

Since this ships as a single release, rollback means **publishing a hotfix release** that reverts
to the old architecture. This is feasible because old data files are preserved:

| Scenario | Recovery |
|---|---|
| Migration crashes repeatedly | Old files intact; hotfix release reverts to Realm/config.json/AsyncStorage |
| Migration succeeds but app has bugs | Data is in both old and new stores; hotfix can read from either |
| Everything works | Phase 7 (future release) deletes old files once confident |

**Key safety rule**: Old data files (`main.realm`, `config.json`, AsyncStorage) are **never
deleted** during this release. They are only cleaned up in a future Phase 7 release, after
the migration has been stable in production for a sufficient period.

### Development Strategy

All phases are developed as **separate PRs/branches** that merge into a single release branch:

| PR | Content | Testable independently? |
|---|---|---|
| PR 1 | Phase 1: op-sqlite + Drizzle schema + reactivity bus | Yes — new infra, no behavior change |
| PR 2 | Phase 2: Keychain + MMKV migration | Yes — run migration, verify keys/prefs accessible |
| PR 3 | Phase 3: Action queue replacement | Yes — send messages, verify queue works |
| PR 4 | Phase 4: Realm → SQLite migration + all Realm replacements | Yes — full chat flow regression test |
| PR 5 | Phase 5: UX data decoupling (contacts, capabilities, media) | Yes — verify contact display, capabilities |
| PR 6 | Phase 6: Service info cache | Yes — verify service info fetching |
| PR 7 | Backup/restore updates | Yes — backup + restore round-trip test |

PRs merge sequentially into a release branch. Each PR is code-reviewed and tested before the
next one merges. The release branch is tested end-to-end before shipping.

### Future Phase 7: Cleanup (separate release, after migration is stable)

Once the migration has been running in production without issues (e.g., 2–4 weeks), ship a
follow-up release that:

1. Deletes old data files (`main.realm`, `config.json`, AsyncStorage data)
2. Removes `realm` build dependency and the `src/services/migration/` module
3. Removes `@react-native-async-storage/async-storage` dependency
4. Deletes dead code (Realm models, old service files — see Phase 7 file list above)

---

## 11. Performance Considerations

- **WAL mode**: concurrent reads during writes, critical for chat UX
- **Indexes**: all query paths have covering indexes
- **Synchronous reads**: op-sqlite's sync API means no `await` for UI queries
- **Batch writes**: Drizzle transactions for multi-row operations (receipts, reactions)
- **Pagination**: `LIMIT`/`OFFSET` on `chat_entries` queries (50 per page)
- **No full-record deserialization**: unlike Credo's `getAll()` + in-memory filter, queries only fetch needed columns
- **updateHook granularity**: table-level; hooks can debounce if needed for high-frequency updates (e.g., download progress)

---

## 12. Security

- App SQLite encrypted with SQLCipher via op-sqlite's `encryptionKey` option
- All encryption keys stored in Platform Keychain with **`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`**:
  - **Hardware-backed** (Secure Enclave / TEE / StrongBox)
  - **Background-accessible** after first device unlock (enables push notification handling)
  - **Non-exportable** (not included in iCloud/Google backups, preventing key leakage)
  - **No biometric prompt per access** (biometric/PIN protects device unlock, not individual key reads)
- MMKV stores only non-sensitive preferences (no keys, no PII)
- Credo's Askar DB unchanged (hardware-backed key derivation)
- **Upgrade from `config.json`**: current keys are stored as plaintext hex in a JSON file on the
  filesystem with no hardware protection. The keychain migration is a significant security improvement
