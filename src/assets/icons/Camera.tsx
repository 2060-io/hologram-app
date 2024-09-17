import React from 'react'
import Svg, { Path, Circle, SvgProps } from 'react-native-svg'

const Camera: React.FC<SvgProps> = props => (
  <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
    <Path data-name="Path 360" d="M0 0h24v24H0Z" fill="none" />
    <Circle data-name="Ellipse 35" cx={3} cy={3} r={3} transform="translate(9 9)" fill={props.fill} />
    <Path
      data-name="Path 361"
      d="M20 4h-3.17l-1.24-1.35A1.991 1.991 0 0 0 14.12 2H9.88a2.029 2.029 0 0 0-1.48.65L7.17 4H4a2.006 2.006 0 0 0-2 2v12a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V6a2.006 2.006 0 0 0-2-2Zm-8 13a5 5 0 1 1 5-5 5 5 0 0 1-5 5Z"
      fill={props.fill}
    />
  </Svg>
)

export default Camera
