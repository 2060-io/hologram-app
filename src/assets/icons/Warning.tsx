import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Warning: React.FC<SvgProps> = props => (
  <Svg width={19.063} height={17.008} viewBox="0 0 19.063 17.008" {...props}>
    <Path
      d="m9.531 1.998 7.53 13.01H2.001l7.53-13.01m-9.26 12.01a2 2 0 0 0 1.73 3h15.06a2 2 0 0 0 1.73-3L11.261.998a2 2 0 0 0-3.46 0Zm8.26-7v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-2 0Zm0 5h2v2h-2Z"
      fill={props.fill}
    />
  </Svg>
)

export default Warning
