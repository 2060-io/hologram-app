import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Video: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 27.919 22.614" {...props}>
    <Path
      d="M112.343-757.385a2.63 2.63 0 01-1.934-.792 2.631 2.631 0 01-.791-1.934v-17.163a2.63 2.63 0 01.791-1.934 2.63 2.63 0 011.934-.792h17.163a2.631 2.631 0 011.934.792 2.63 2.63 0 01.791 1.934v6.9l4.14-4.14a.645.645 0 01.749-.167.627.627 0 01.416.636v10.7a.626.626 0 01-.416.636.645.645 0 01-.749-.167l-4.14-4.14v6.9a2.631 2.631 0 01-.791 1.934 2.631 2.631 0 01-1.934.792z"
      transform="translate(-109.618 779.999)"
      fill={props.fill}
    />
  </Svg>
)

export default Video
