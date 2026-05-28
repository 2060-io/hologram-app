import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const ShareSocial: React.FC<SvgProps> = (props) => (
  <Svg width={18} height={19.92} viewBox="0 0 18 19.92" {...props}>
    <Path
      data-name="Path 570"
      d="M15 14.08a2.912 2.912 0 0 0-1.96.77L5.91 10.7A3.274 3.274 0 0 0 6 10a3.274 3.274 0 0 0-.09-.7l7.05-4.11A2.993 2.993 0 1 0 12 3a3.274 3.274 0 0 0 .09.7L5.04 7.81a3 3 0 1 0 0 4.38l7.12 4.16a2.821 2.821 0 0 0-.08.65A2.92 2.92 0 1 0 15 14.08Z"
      fill={props.fill}
    />
  </Svg>
)

export default ShareSocial
