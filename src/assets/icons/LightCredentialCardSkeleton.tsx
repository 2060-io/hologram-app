import * as React from 'react'
import Svg, { Defs, G, Rect, Circle, Text, TSpan, SvgProps } from 'react-native-svg'

const LightCredentialCardSkeleton: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 394 245" {...props}>
    <Defs />
    <G data-name="Grupo 1869">
      <G data-name="Grupo 1866" transform="translate(15 21)">
        <G transform="translate(-15 -21)" filter="url(#a)">
          <G
            data-name="Rect\xE1ngulo 4037"
            transform="translate(15 21)"
            fill="#fff"
            stroke="#cadde2"
            strokeWidth={0.75}
          >
            <Rect width={364} height={215} rx={8.56} stroke="none" />
            <Rect x={0.375} y={0.375} width={363.25} height={214.25} rx={8.185} fill="none" />
          </G>
        </G>
        <Rect
          data-name="Rect\xE1ngulo 4045"
          width={131}
          height={21}
          rx={10.5}
          transform="translate(216 37)"
          fill="#9cb1b7"
          opacity={0.256}
        />
        <Rect
          data-name="Rect\xE1ngulo 4046"
          width={170}
          height={21}
          rx={10.5}
          transform="translate(177 69)"
          fill="#9cb1b7"
          opacity={0.256}
        />
        <Rect
          data-name="Rect\xE1ngulo 4043"
          width={170}
          height={16}
          rx={8}
          transform="translate(13 183)"
          fill="#e6ebed"
        />
        <Rect
          data-name="Rect\xE1ngulo 4044"
          width={193}
          height={10}
          rx={5}
          transform="translate(13 162)"
          fill="#cadde2"
          opacity={0.232}
        />
        <G data-name="Grupo 1864" transform="translate(13 16)">
          <Circle data-name="Elipse 157" cx={37} cy={37} r={37} fill="#f3f7f8" />
          <Text
            transform="translate(13 43)"
            fill="#a1b0b5"
            fontSize={16}
            fontFamily="EuclidCircularA-Medium, Euclid Circular A"
            fontWeight={500}
          >
            <TSpan x={0} y={0}>
              {'CARD'}
            </TSpan>
          </Text>
        </G>
      </G>
    </G>
  </Svg>
)

export default LightCredentialCardSkeleton
