import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const DoubleCheckMarkFilled: React.FC<SvgProps> = props => (
  <Svg width={12.84} height={9.51} viewBox="0 0 12.84 9.51" {...props}>
    <Path data-name="Path 425" d="M3.446 0h9.394v9.51H3.446Z" fill="none" />
    <Path
      data-name="Path 426"
      d="M8.143.862a3.894 3.894 0 0 0 0 7.787 3.894 3.894 0 0 0 0-7.787ZM7.108 6.426l-1.377-1.4a.392.392 0 0 1 0-.549.378.378 0 0 1 .541 0l1.104 1.124 2.639-2.679a.378.378 0 0 1 .541 0 .392.392 0 0 1 0 .549L7.645 6.426a.378.378 0 0 1-.541 0Z"
      fill={props.fill}
    />
    <Path
      data-name="Subtraction 2"
      d="M4.308 8.649A4.121 4.121 0 0 1 0 4.755 4.121 4.121 0 0 1 4.308.861a4.8 4.8 0 0 1 .668.047 4.872 4.872 0 0 0-1.96 3.847 4.656 4.656 0 0 0 .025.48L2.2 4.479a.461.461 0 0 0-.608 0 .362.362 0 0 0 0 .549l1.547 1.4a.445.445 0 0 0 .231.108 5.115 5.115 0 0 0 1.606 2.066 4.8 4.8 0 0 1-.668.047Z"
      fill={props.fill}
    />
  </Svg>
)

export default DoubleCheckMarkFilled
