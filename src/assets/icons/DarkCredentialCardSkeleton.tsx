import React from 'react'
import Svg, { Defs, G, Rect, Circle, Text, TSpan, SvgProps } from 'react-native-svg'

const DarkCredentialCardSkeleton: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 394 245" {...props}>
    <Defs />
    <G data-name="Grupo 1992" transform="translate(-7138 -4270)">
      <G transform="translate(7138 4270)" filter="url(#a)">
        <G
          data-name="Rect\xE1ngulo 4037"
          transform="translate(15 21)"
          fill="#35393b"
          stroke="#44494b"
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
        transform="translate(7369 4328)"
        fill="#464c4e"
      />
      <Rect
        data-name="Rect\xE1ngulo 4046"
        width={170}
        height={21}
        rx={10.5}
        transform="translate(7330 4360)"
        fill="#464c4e"
      />
      <Rect
        data-name="Rect\xE1ngulo 4043"
        width={170}
        height={16}
        rx={8}
        transform="translate(7166 4474)"
        fill="#464c4e"
      />
      <Rect
        data-name="Rect\xE1ngulo 4044"
        width={193}
        height={10}
        rx={5}
        transform="translate(7166 4453)"
        fill="#464c4e"
      />
      <G data-name="Grupo 1864" transform="translate(7166 4307)">
        <Circle data-name="Elipse 157" cx={37} cy={37} r={37} fill="#91979a" />
        <Text
          transform="translate(13 43)"
          fill="#182022"
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
  </Svg>
)

export default DarkCredentialCardSkeleton
