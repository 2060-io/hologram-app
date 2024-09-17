import React from 'react'
import Svg, { G, Path, Circle, SvgProps } from 'react-native-svg'

const PersonSquare: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 23.54 23.54" {...props}>
    <G data-name="Grupo 1885" fill="none">
      <Path data-name="Rect\xE1ngulo 4059" d="M0 0H23.54V23.54H0z" />
      <Path data-name="Rect\xE1ngulo 4060" d="M0 0H23.54V23.54H0z" />
    </G>
    <G data-name="Grupo 1890">
      <G data-name="Grupo 1889">
        <G data-name="Grupo 1886">
          <Path
            data-name="Trazado 651"
            d="M20.582 3H2.958A1.959 1.959 0 001 4.949v7.8h1.958v-7.8h17.624V20.54a1.959 1.959 0 001.958-1.949V4.949A1.959 1.959 0 0020.582 3z"
            transform="translate(1 3) translate(-1 -3)"
            fill={props.fill}
          />
        </G>
        <G data-name="Grupo 1887">
          <Circle
            data-name="Elipse 158"
            cx={4}
            cy={4}
            r={4}
            fill={props.fill}
            transform="translate(1 3) translate(3.869 2.875)"
          />
        </G>
        <G data-name="Grupo 1888">
          <Path
            data-name="Trazado 652"
            d="M15.39 16.56a13.867 13.867 0 00-12.78 0A2.971 2.971 0 001 19.22V22h16v-2.78a2.971 2.971 0 00-1.61-2.66z"
            transform="translate(1 3) translate(0 11.54) translate(-1 -15)"
            fill={props.fill}
          />
        </G>
      </G>
    </G>
  </Svg>
)

export default PersonSquare
