import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const SingleCheckMark: React.FC<SvgProps> = (props) => (
  <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
    <Path data-name="Path 427" d="M0 0h12v12H0Z" fill="none" />
    <Path
      data-name="Path 428"
      d="M6 1a5 5 0 1 0 5 5 5 5 0 0 0-5-5Zm0 9a4 4 0 1 1 4-4 4.005 4.005 0 0 1-4 4Zm1.94-5.855L5 7.085l-.94-.94a.5.5 0 0 0-.7.7l1.3 1.295a.5.5 0 0 0 .7 0l3.29-3.29a.5.5 0 0 0 0-.7.5.5 0 0 0-.71 0Z"
      fill={props.fill}
    />
  </Svg>
)

export default SingleCheckMark
