import React, { useState } from 'react'

import { VideoPlayer } from '@2060/components'

type Props = {
  path: string
}

const VideoRecorded = ({ path }: Props) => {
  const [showControl, setShowControl] = useState(true)
  return <VideoPlayer uri={path} showControl={showControl} setShowControl={setShowControl} />
}

export default VideoRecorded
