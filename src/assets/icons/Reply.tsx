import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Reply: React.FC<SvgProps> = props => (
  <Svg width={17.12} height={17.12} viewBox="0 0 17.12 17.12" {...props}>
    <Path data-name="Path 800" d="M0 0h17.12v17.12H0Z" fill="none" />
    <Path
      data-name="Path 801"
      d="M7.156 6.292v-1.17A.7.7 0 0 0 5.95 4.6L2.713 7.978a.755.755 0 0 0 0 1.037l3.237 3.376a.7.7 0 0 0 1.206-.513v-1.247c3.526 0 5.995 1.177 7.758 3.751-.705-3.677-2.821-7.355-7.758-8.09Z"
      fill={props.fill}
    />
  </Svg>
)

export default Reply
