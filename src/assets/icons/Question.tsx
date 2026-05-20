import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Question: React.FC<SvgProps> = (props) => (
  <Svg width={19.26} height={19.26} viewBox="0 0 19.26 19.26" {...props}>
    <Path data-name="Path 520" d="M0 0h19.26v19.26H0Z" fill="none" />
    <Path
      data-name="Path 521"
      d="M9.63 2a7.63 7.63 0 1 0 7.63 7.63A7.633 7.633 0 0 0 9.63 2Zm.763 12.971H8.867v-1.526h1.526Zm1.579-5.913-.687.7a2.672 2.672 0 0 0-.794 1.289 3.5 3.5 0 0 0-.1.87H8.867v-.381a3.087 3.087 0 0 1 .168-1 3.05 3.05 0 0 1 .725-1.16l.946-.961a1.5 1.5 0 0 0 .42-1.373 1.519 1.519 0 0 0-1.061-1.167 1.538 1.538 0 0 0-1.885.969.674.674 0 0 1-.626.5h-.228a.661.661 0 0 1-.626-.858 3.058 3.058 0 0 1 2.465-2.159A3.1 3.1 0 0 1 12.117 5.7a2.523 2.523 0 0 1-.145 3.358Z"
      fill={props.fill}
    />
  </Svg>
)

export default Question
