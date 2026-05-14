import React from 'react'
import Svg, { G, Rect, SvgProps } from 'react-native-svg'

const Pending: React.FC<SvgProps> = (props) => (
  <Svg width={10} height={10} viewBox="0 0 10 10" {...props}>
    <G data-name="Rectangle 4739" fill="none" stroke={props.fill} strokeDasharray={2}>
      <Rect width={10} height={10} rx={5} stroke="none" />
      <Rect x={0.5} y={0.5} width={9} height={9} rx={4.5} />
    </G>
  </Svg>
)

export default Pending
