import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const Services: React.FC<SvgProps> = props => (
  <Svg width={23.54} height={23.54} viewBox="0 0 23.54 23.54" {...props}>
    <G data-name="Grupo 1377">
      <Path data-name="Rect\xE1ngulo 825" fill="none" d="M0 0H23.54V23.54H0z" />
    </G>
    <G data-name="Grupo 1379">
      <G data-name="Grupo 1378" fill={props.fill}>
        <Path
          data-name="Trazado 443"
          d="M5 11h4a2.006 2.006 0 002-2V5a2.006 2.006 0 00-2-2H5a2.006 2.006 0 00-2 2v4a2.006 2.006 0 002 2z"
          transform="translate(3 3) translate(-3 -3)"
        />
        <Path
          data-name="Trazado 444"
          d="M5 21h4a2.006 2.006 0 002-2v-4a2.006 2.006 0 00-2-2H5a2.006 2.006 0 00-2 2v4a2.006 2.006 0 002 2z"
          transform="translate(3 3) translate(-3 -3.46)"
        />
        <Path
          data-name="Trazado 445"
          d="M13 5v4a2.006 2.006 0 002 2h4a2.006 2.006 0 002-2V5a2.006 2.006 0 00-2-2h-4a2.006 2.006 0 00-2 2z"
          transform="translate(3 3) translate(-3.46 -3)"
        />
        <Path
          data-name="Trazado 446"
          d="M15 21h4a2.006 2.006 0 002-2v-4a2.006 2.006 0 00-2-2h-4a2.006 2.006 0 00-2 2v4a2.006 2.006 0 002 2z"
          transform="translate(3 3) translate(-3.46 -3.46)"
        />
      </G>
    </G>
  </Svg>
)

export default Services
