import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const Download: React.FC<SvgProps> = (props) => (
  <Svg width={44} height={44} viewBox="0 0 24 24" strokeWidth={2.5} stroke={props.fill} {...props} fill="none">
    <Path d="M0 0h24v24H0z" stroke="none" />
    <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5m-5-7v12" />
  </Svg>
)

export default Download
