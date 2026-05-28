import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

const IncomingCall: React.FC<SvgProps> = (props) => {
  return (
    <Svg viewBox="0 0 25.68 19.26" {...props}>
      <G data-name="Grupo 2195">
        <G data-name="Grupo 2188" transform="translate(-7451.918 -10569)">
          <Rect
            data-name="Rect\xE1ngulo 6411"
            width={25.68}
            height={19.26}
            rx={4}
            transform="translate(7451.918 10569)"
            fill={props.fill}
          />
          <G data-name="Grupo 2187" fill="#fff" fillRule="evenodd">
            <Path
              data-name="Trazado 959"
              d="M17.654 7.667a.519.519 0 01-.519.519h-3.116a.519.519 0 01-.519-.519V4.552a.519.519 0 111.038 0v1.862l3.268-3.268a.519.519 0 11.734.734l-3.268 3.268h1.862a.519.519 0 01.52.519z"
              transform="translate(7456.698 10570.57) translate(-5.112 -.456)"
            />
            <Path
              data-name="Trazado 960"
              d="M1.5 3.374A1.874 1.874 0 013.374 1.5h.857a1.172 1.172 0 011.136.887l.69 2.763a1.171 1.171 0 01-.434 1.221l-.808.606a.2.2 0 00-.079.22 7.05 7.05 0 004.184 4.184.2.2 0 00.22-.079l.606-.808a1.171 1.171 0 011.221-.434l2.763.69a1.172 1.172 0 01.887 1.137v.856a1.874 1.874 0 01-1.874 1.874h-1.404A9.84 9.84 0 011.5 4.78z"
              transform="translate(7456.698 10570.57)"
            />
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default IncomingCall
