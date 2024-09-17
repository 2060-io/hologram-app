import type { BaseEvent } from '@credo-ts/core'

export enum MediatorEventTypes {
  MediatorConnected = 'MediatorConnected',
  MediatorDisconnected = 'MediatorDisconnected',
}

export interface MediatorConnectedEvent extends BaseEvent {
  type: MediatorEventTypes.MediatorConnected
  payload: {
    connectionId: string
    mediatorId?: string
  }
}

export interface MediatorDisconnectedEvent extends BaseEvent {
  type: MediatorEventTypes.MediatorDisconnected
  payload: {
    connectionId: string
    mediatorId?: string
  }
}
