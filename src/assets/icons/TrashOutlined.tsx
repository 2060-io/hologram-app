import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const TrashOutlined: React.FC<SvgProps> = (props) => (
  <Svg width={12.84} height={17.12} viewBox="0 0 12.84 17.12" {...props}>
    <Path
      data-name="Trazado 480"
      d="M15.089 8.707v9.511H7.751V8.707h7.337M13.713 3H9.127l-.917.951H5v1.9h12.84v-1.9h-3.21zm3.21 3.8H5.917v11.418a1.875 1.875 0 001.834 1.9h7.337a1.875 1.875 0 001.834-1.9z"
      transform="translate(-5 -3)"
      fill={props.fill}
    />
  </Svg>
)

export default TrashOutlined
