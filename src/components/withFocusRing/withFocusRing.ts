import {rem} from '@sanity/ui'
import type {ComponentType} from 'react'
import {css, styled} from 'styled-components'

import {focusRingBorderStyle, focusRingStyle} from './helpers'

export function withFocusRing<Props>(component: ComponentType<Props>) {
  return styled(component as unknown as ComponentType<unknown>)<Props & {$border?: boolean}>(
    (props) => {
      const border = {
        width: props.$border ? 1 : 0,
        color: 'var(--card-border-color)',
      }

      return css`
        --card-focus-box-shadow: ${focusRingBorderStyle(border)};

        border-radius: ${rem(props.theme.sanity.radius[1])};
        outline: none;
        box-shadow: var(--card-focus-box-shadow);

        &:focus {
          --card-focus-box-shadow: ${focusRingStyle({
            base: props.theme.sanity.color.base,
            border,
            focusRing: props.theme.sanity.focusRing,
          })};
        }
      `
    }
  )
}
