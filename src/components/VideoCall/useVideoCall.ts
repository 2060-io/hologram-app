import appCheck from '@react-native-firebase/app-check'
import axios from 'axios'
import {
  OrientationLock,
  lockAsync as setScreenOrientation,
  unlockAsync as resetScreenOrientation,
} from 'expo-screen-orientation'
import { Device, types } from 'mediasoup-client'
import { WebSocketTransport, Peer } from 'protoo-client'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import InCallManager from 'react-native-incall-manager'
import { MediaStream, mediaDevices, registerGlobals } from 'react-native-webrtc'

import { useMobileAgent } from '@2060/hooks/agent'
import { useConfig } from '@2060/hooks/providers/ConfigProvider'
import {
  ConnectionStatus,
  CallStatus,
  useVideoCallContext,
  IncomingCallInfo,
} from '@2060/hooks/providers/useVideoCallContext'
import { log, logError } from '@2060/utils'

function generatePeerId(length = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const fetchNewRoomId = async (webRtcServerBaseUrl: string) => {
  try {
    const { token } = await appCheck().getToken()
    const response = await axios.post(`${webRtcServerBaseUrl}/rooms`, {
      validateStatus: function (status: number) {
        return status === 200 // Resolve only if the status code 200
      },
      headers: {
        'X-Firebase-AppCheck': token,
      },
    })
    return {
      ...response.data,
      wsUrl: response.data.wsUrl.substring(0, response.data.wsUrl.indexOf('?')),
    } as IncomingCallInfo
  } catch (error) {
    logError('Error fetching RoomId:', error)
    throw new Error(`${error}`)
  }
}

// These structures are the ones used by mediasoup-client, present in current 2060-mediasoup-v1 protocol

//type RTCIceTransportPolicy = 'all' | 'relay'
type RTCIceCredentialType = 'oauth' | 'password'

type RTCIceServer = {
  urls: string | string[]
  username?: string
  credential?: string
  credentialType?: RTCIceCredentialType
}

type TransportInfo = {
  id: string
  iceParameters: types.IceParameters
  iceCandidates: types.IceCandidate[]
  dtlsParameters: types.DtlsParameters
  sctpParameters: types.SctpParameters
  iceServers?: RTCIceServer[]
}

const getTransportOptions = (transportInfo: TransportInfo) => {
  const { id, iceParameters, iceCandidates, dtlsParameters, sctpParameters, iceServers } = transportInfo
  return {
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters: {
      ...dtlsParameters,
      role: 'auto' as types.DtlsRole,
    },
    sctpParameters,
    iceServers,
    //iceTransportPolicy: 'relay' as RTCIceTransportPolicy, // TODO: check if it is needed
  }
}

registerGlobals()

export const useVideoCall = () => {
  const { t } = useTranslation()
  const {
    connectionStatus,
    updateCallStatus,
    onCallFinished,
    incomingCallInfo,
    didcommCallType,
    didcommConnection,
    isVideoCall,
    isCameraOn,
    handleCamera,
    isRejected,
    remotePeerClosedTimeoutRef,
  } = useVideoCallContext()
  const { agent } = useMobileAgent()
  const connectionStatusRef = useRef<ConnectionStatus>(connectionStatus)
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream>()
  const localAudioStreamRef = useRef<MediaStream>()
  const [remoteStream, setRemoteStream] = useState<MediaStream>()
  const remoteStreamRef = useRef<MediaStream>()
  const roomId = useRef<string>()
  const peerId = useRef<string>()
  const peer = useRef<Peer>()
  const facingMode = useRef<'environment' | 'user'>('user')
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true)
  const [isRemoteVideoOn, setIsRemoteVideoOn] = useState(false)
  const videoConsumer = useRef<types.Consumer>()
  const audioConsumer = useRef<types.Consumer>()
  const [isUsingSpeakers, setIsUsingSpeakers] = useState(isVideoCall)
  const sendTransport = useRef<types.Transport<types.AppData>>()
  const recvTransport = useRef<types.Transport<types.AppData>>()
  const micProducer = useRef<types.Producer<types.AppData>>()
  const videoProducer = useRef<types.Producer<types.AppData>>()
  const device = useRef<Device>()
  const routerRtpCapabilities = useRef<types.RtpCapabilities>()
  const isMicrophoneOnRef = useRef(true)
  const lostConnection = useRef(false)
  const newRemotePeerLastConnection = useRef<Date>()
  const { devEnvs } = useConfig()

  useEffect(() => {
    const initialize = async () => {
      if (!agent || !didcommConnection || !didcommCallType) return
      try {
        setScreenOrientation(OrientationLock.PORTRAIT_UP)
        InCallManager.start({ media: isVideoCall ? 'video' : 'audio' })
        const callInfo = incomingCallInfo
          ? incomingCallInfo
          : await fetchNewRoomId(devEnvs.WEBRTC_SERVER_BASE_URL)
        roomId.current = callInfo.roomId
        peerId.current = callInfo.peerId ?? generatePeerId()
        const socketUrl = `${callInfo.wsUrl}/?roomId=${roomId.current}&peerId=${peerId.current}`
        const webSocketTransport = new WebSocketTransport(socketUrl)
        peer.current = new Peer(webSocketTransport)
        peer.current.on('open', async () => {
          log('Socket Connection opened')
          await createSendTransport()
          await createRecvTransport()
          await joinRoom()
          await startToProduceStream()
          if (!incomingCallInfo && !lostConnection.current) {
            await agent.modules.calls.offer({
              callType: didcommCallType,
              connectionId: didcommConnection.id,
              parameters: { ...callInfo },
            })
          }
          updateCallStatus({ status: CallStatus.Connected, statusMessage: 'Connected' })
        })
        peer.current.on('request', async (request, accept, reject) => {
          log('new peer request', request)
          if (request.method === 'newConsumer') {
            try {
              log('*********** New Consumer!')
              const { peerId: consumerPeerId, producerId, id, kind, rtpParameters, appData } = request.data
              const consumerOptions = {
                id,
                producerId,
                kind,
                rtpParameters,
                streamId: `${consumerPeerId}-${appData.share ? 'share' : 'mic-webcam'}`,
                appData: { ...appData, consumerPeerId }, // Trick.
              }

              accept()
              if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream()
              if (kind === 'video') {
                if (videoConsumer.current) remoteStreamRef.current.removeTrack(videoConsumer.current.track)
                videoConsumer.current = await recvTransport.current?.consume(consumerOptions)
                remoteStreamRef.current.addTrack(videoConsumer.current?.track)
                setIsRemoteVideoOn(true)
              }
              if (kind === 'audio') {
                if (audioConsumer.current) remoteStreamRef.current.removeTrack(audioConsumer.current.track)
                audioConsumer.current = await recvTransport.current?.consume(consumerOptions)
                remoteStreamRef.current.addTrack(audioConsumer.current?.track)
              }
              setRemoteStream(remoteStreamRef.current)
            } catch (error) {
              logError('Error when new consumer is coming', error)
              reject(new Error(`${error}`))
            }
          }
        })
        peer.current.on('disconnected', () => {
          log('Socket connection disconnected', new Date().toLocaleTimeString())
          lostConnection.current = true
          cleanObjects()
          updateCallStatus({ status: CallStatus.Disconnected, statusMessage: 'Disconnected' })
        })
        peer.current.on('failed', retryNumber => {
          log('Socket connection failed', retryNumber, new Date().toLocaleTimeString())
        })
        peer.current.on('notification', notification => {
          switch (notification.method) {
            case 'producerScore': {
              break
            }
            case 'newPeer': {
              newRemotePeerLastConnection.current = new Date()
              const newPeer = notification.data
              log('new remote Peer', newPeer)
              break
            }
            /* This event is fired when:
          1. another peer lost internet connection and never could reach call again
          2. when another peer had lost internet connection and could re-connect once again
          3. when simply another connection removes app from stack
          */
            case 'peerClosed': {
              log('remote peer closed', notification)
              const peerClosedDate = new Date()
              /* This timeout before finish call is added because when
            remote peer had lost internet connection and could re-connect once again
            this peer is called, so we need to wait 5 seconds (accurate number) to check if after close
            were a new peer connection (it means could re-connected once again) if so, we do not finishCall
            */
              remotePeerClosedTimeoutRef.current = setTimeout(() => {
                const wasThereNewPeerAfterClosed = newRemotePeerLastConnection.current
                  ? newRemotePeerLastConnection.current > peerClosedDate
                  : false
                if (!wasThereNewPeerAfterClosed) finishCall()
              }, 5000)
              break
            }
            case 'peerDisplayNameChanged': {
              break
            }
            case 'downlinkBwe': {
              break
            }
            case 'consumerClosed': {
              setIsRemoteVideoOn(false)
              break
            }
            case 'consumerPaused': {
              break
            }
            case 'consumerResumed': {
              break
            }
            case 'consumerLayersChanged': {
              break
            }
            case 'consumerScore': {
              break
            }
            case 'dataConsumerClosed': {
              break
            }
            case 'activeSpeaker': {
              break
            }
            default: {
              log('unknown protoo notification.method "%s"', notification)
            }
          }
        })
        //This listener is fired when peer.current.close() is executed or
        // when socket tries to reconnect 10 times and can't reach call again
        peer.current.on('close', () => {
          log('local peer closed')
          finishCall()
        })
      } catch (error) {
        finishCall(t('call.errorWhileConnecting'))
        logError('Error initialing video call', error)
      }
    }
    initialize()

    return () => {
      cleanObjects()
      resetScreenOrientation()
    }
  }, [agent, devEnvs])

  useEffect(() => {
    InCallManager.setForceSpeakerphoneOn(isUsingSpeakers)
    InCallManager.setSpeakerphoneOn(isUsingSpeakers)
  }, [isUsingSpeakers])

  useEffect(() => {
    connectionStatusRef.current = { ...connectionStatus }
  }, [connectionStatus])

  useEffect(() => {
    if (isRejected) {
      finishCall(t('call.hasRefusedCall'))
    }
  }, [isRejected])

  useEffect(() => {
    if (!localAudioStreamRef.current) return
    isMicrophoneOnRef.current = isMicrophoneOn
    handleMicrophone()
  }, [isMicrophoneOn])

  const handleCameraSwitched = () => {
    handleCamera(async newIsCameraOn => {
      if (newIsCameraOn) {
        await startToProduceVideo()
      } else {
        stopToProduceVideo()
      }
    })
  }

  const handleMicrophone = () => {
    if (micProducer.current?.id) {
      const request = isMicrophoneOnRef.current ? 'resumeProducer' : 'pauseProducer'
      peer.current?.request(request, { producerId: micProducer.current?.id })
    }
    localAudioStreamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = isMicrophoneOnRef.current
    })
  }

  const createSendTransport = async () => {
    try {
      device.current = new Device()
      routerRtpCapabilities.current = await peer.current?.request('getRouterRtpCapabilities')
      if (!routerRtpCapabilities.current) return

      // Remove video orientation extension due to incompatibilities with pymediasoup and other clients
      routerRtpCapabilities.current.headerExtensions = routerRtpCapabilities.current.headerExtensions?.filter(
        ext => ext.uri !== 'urn:3gpp:video-orientation',
      )
      await device.current.load({
        routerRtpCapabilities: routerRtpCapabilities.current,
      })
      const producerTransportInfo = await peer.current?.request('createWebRtcTransport', {
        forceTcp: false,
        producing: true,
        consuming: false,
        sctpCapabilities: true,
      })
      const senderTransportOptions = getTransportOptions(producerTransportInfo)
      sendTransport.current = device.current.createSendTransport(senderTransportOptions)
      sendTransport.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          log('Transport Connected successfully', dtlsParameters)
          await peer.current?.request('connectWebRtcTransport', {
            transportId: sendTransport.current?.id,
            dtlsParameters,
          })
          callback()
        } catch (error) {
          logError('Error connecting transport:', error)
          errback(new Error(`${error}`))
        }
      })
      sendTransport.current.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        log('rtpParameters on produce', rtpParameters)
        try {
          const { id } = await peer.current?.request('produce', {
            transportId: sendTransport.current?.id,
            kind,
            rtpParameters,
            appData,
          })
          callback({ id })
        } catch (error) {
          errback(new Error(`${error}`))
        }
      })
      const { id } = producerTransportInfo
      sendTransport.current.on(
        'producedata',
        async ({ sctpStreamParameters, label, protocol, appData }, callback, errback) => {
          try {
            await peer.current?.request('produceData', {
              transportId: sendTransport.current?.id,
              sctpStreamParameters,
              label,
              protocol,
              appData,
            })
            // Done in the server, pass the response to our transport.
            callback({ id })
          } catch (error) {
            // Something was wrong in server side.
            errback(new Error(`${error}`))
          }
        },
      )
    } catch (error) {
      logError('Error creating send transport:', error)
    }
  }

  const joinRoom = async () => {
    const joinRoomResponse = await peer.current?.request('join', {
      displayName: 'test Name',
      device: device.current,
      rtpCapabilities: routerRtpCapabilities.current,
      sctpCapabilities: undefined,
    })
    log('Joined successfully to the room ', joinRoomResponse, roomId.current)
  }

  const startToProduceStream = async () => {
    await startToProduceAudio()
    if (isVideoCall && isCameraOn) {
      await startToProduceVideo()
    }
    await produceData()
  }

  const startToProduceAudio = async () => {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
    })
    localAudioStreamRef.current = stream
    const audioTrack = localAudioStreamRef.current.getAudioTracks()[0]
    micProducer.current = await sendTransport.current?.produce({
      track: audioTrack,
    })
    if (lostConnection.current) handleMicrophone()
  }

  const startToProduceVideo = async () => {
    const stream = await mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.current,
      },
    })
    setLocalVideoStream(stream)
    const videoTrack = stream.getVideoTracks()[0]
    videoProducer.current = await sendTransport.current?.produce({
      track: videoTrack,
    })
  }

  const stopToProduceVideo = () => {
    localVideoStream?.release()
    setLocalVideoStream(undefined)
    if (videoProducer.current?.id) {
      peer.current?.request('closeProducer', { producerId: videoProducer.current?.id })
      videoProducer.current?.close()
    }
  }

  const produceData = async () => {
    await sendTransport.current?.produceData({
      ordered: true,
      label: 'foo',
    })
  }

  const createRecvTransport = async () => {
    try {
      const consumerTransportInfo = await peer.current?.request('createWebRtcTransport', {
        forceTcp: false,
        producing: false,
        consuming: true,
        sctpCapabilities: true,
      })
      const receiverTransportOptions = getTransportOptions(consumerTransportInfo)
      recvTransport.current = device.current?.createRecvTransport(receiverTransportOptions)
      recvTransport.current?.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          log('Recv Transport Connected successfully', dtlsParameters)
          await peer.current?.request('connectWebRtcTransport', {
            transportId: recvTransport.current?.id,
            dtlsParameters,
          })
          callback()
        } catch (error) {
          logError('Error connecting transport:', error)
          errback(new Error(`${error}`))
        }
      })
      log('RecvTransport ID:', recvTransport.current?.id)
    } catch (error) {
      logError('Error creating recv transport:', error)
    }
  }

  const handleSwitchCamera = () => {
    facingMode.current = facingMode.current === 'environment' ? 'user' : 'environment'
    localVideoStream?.getVideoTracks().forEach(track => {
      // eslint-disable-next-line no-underscore-dangle
      track._switchCamera()
    })
  }

  const handleSwitchSpeakers = () => setIsUsingSpeakers(!isUsingSpeakers)

  const hangup = async () => {
    if (!agent || !didcommConnection) return
    await agent.modules.calls.hangup({ connectionId: didcommConnection.id })
    finishCall()
  }

  const finishCall = (message?: string) => {
    peer.current?.close()
    let finishedReason = message ? message : t('call.callEnded')
    if (connectionStatusRef.current.status === CallStatus.Disconnected) {
      finishedReason = t('call.networkFailed')
    }
    cleanObjects()
    updateCallStatus({ status: CallStatus.Finished, statusMessage: finishedReason })
    onCallFinished()
  }

  const cleanObjects = () => {
    InCallManager.stop()
    audioConsumer.current = undefined
    videoConsumer.current = undefined
    micProducer.current = undefined
    videoProducer.current = undefined
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.release()
      localAudioStreamRef.current = undefined
    }
    if (localVideoStream) {
      localVideoStream.release()
      setLocalVideoStream(undefined)
    }
    remoteStreamRef.current = undefined
    setRemoteStream(undefined)
    sendTransport.current?.close()
    sendTransport.current = undefined
    recvTransport.current?.close()
    recvTransport.current = undefined
  }

  return {
    didcommCallType,
    localVideoStream,
    remoteStream,
    handleSwitchCamera,
    handleCameraSwitched,
    handleSwitchSpeakers,
    isUsingSpeakers,
    setIsMicrophoneOn,
    hangup,
    finishCall,
    isRemoteVideoOn,
    isCameraOn,
    isMicrophoneOn,
    isVideoCall,
    connectionStatus,
    didcommConnection,
  }
}
