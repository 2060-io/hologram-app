import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Developer: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 30 30" {...props}>
    <Path
      d="M15 3A12 12 0 003 15a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0015 3zm1.8 6l1.48.691-.473.98 6.048 3.735v1.381l-4.728 2.934-.86-1.309 3.926-2.314-5.078-2.971L12.835 21l-1.49-.68.485-1.006-5.685-3.527v-1.369l4.74-2.945.847 1.32-3.939 2.305 4.728 2.775z"
      transform="translate(0 -289.063) translate(0 289.063)"
      opacity={1}
      fill={props.fill}
      fillOpacity={1}
      stroke="none"
      strokeWidth={1.99999988}
      strokeMiterlimit={4}
      strokeDasharray="none"
      strokeOpacity={0.7716895}
    />
  </Svg>
)

export default Developer
