import { useChat } from '@src/hooks/agent'
import React from 'react'
import PeerSecuritySystemMessage from './PeerSecuritySystemMessage'
import { Props, WithConnectionValidateProps } from './Props'
import ServiceSecuritySystemMessage from './ServiceSecuritySystemMessage'

const withConnectionValidate = () => (props: WithConnectionValidateProps) => {
  if (!props.connection) {
    return <PeerSecuritySystemMessage />
  }
  return <SecuritySystemMessageView {...(props as Props)} />
}

const SecuritySystemMessageView = ({ connection }: Props) => {
  const { chatThread } = useChat()
  const serviceInfo = chatThread?.flags.serviceInfo
  return serviceInfo ? (
    <ServiceSecuritySystemMessage serviceInfo={serviceInfo} />
  ) : (
    <PeerSecuritySystemMessage connection={connection} />
  )
}

export default withConnectionValidate()
