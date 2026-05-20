import React from 'react'
import Svg, { Circle, G, Path, SvgProps } from 'react-native-svg'

const People: React.FC<SvgProps> = (props) => (
  <Svg width={23.54} height={23.54} viewBox="0 0 23.54 23.54" {...props}>
    <G data-name="Grupo 1374" fill="none">
      <Path data-name="Rect\xE1ngulo 823" d="M0 0H23.54V23.54H0z" />
      <Path data-name="Rect\xE1ngulo 824" d="M0 0H23.54V23.54H0z" />
    </G>
    <G data-name="Grupo 1376">
      <G data-name="Grupo 1375" fill={props.fill} transform="translate(2 3.54)">
        <Circle data-name="Elipse 50" cx={4} cy={4} r={4} transform="translate(3.841)" />
        <Path
          data-name="Trazado 441"
          d="M10.35 14.01C7.62 13.91 2 15.27 2 18v1a1 1 0 001 1h8.54a5.95 5.95 0 01-1.19-5.99z"
          transform="translate(-2 -4)"
        />
        <Path
          data-name="Trazado 442"
          d="M19.43 18.02a3.908 3.908 0 00.48-2.82 4 4 0 10-4.72 4.72 3.908 3.908 0 002.82-.48l1.86 1.86a1 1 0 001.41 0 1 1 0 000-1.41zM16 18a2 2 0 112-2 2.006 2.006 0 01-2 2z"
          transform="translate(-2.46 -4)"
        />
      </G>
    </G>
  </Svg>
)

export default People
