import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Default: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 32 32" {...props}>
    <Path d="M14 23H18V27H14z" fill="none" stroke={props.fill} strokeWidth={2} strokeMiterlimit={10} />
    <Path
      d="M16 5c-3.866 0-7 2.686-7 6v2h4v-2c0-1.105 1.343-2 3-2s3 .877 3 2c0 3.321-5 3.782-5 8h4c0-2.629 5-3.039 5-8 0-3.273-3.134-6-7-6z"
      fill="none"
      stroke={props.fill}
      strokeWidth={2}
      strokeMiterlimit={10}
    />
  </Svg>
)

export default Default
