import { DidCommActionMenu, DidCommActionMenuRecord, DidCommActionMenuRole } from '@credo-ts/didcomm-action-menu'
import { useEffect, useState } from 'react'

import { useMobileAgent } from './MobileAgentProvider'
import { recordsAddedByType, recordsRemovedByType, recordsUpdatedByType } from './recordUtils'

interface ActionMenuQueryOptions {
  connectionId?: string
}

export const useActionMenu = (options: ActionMenuQueryOptions) => {
  const { agent } = useMobileAgent()

  const [state, setState] = useState<{ menu: DidCommActionMenu | undefined; loading: boolean }>({
    menu: undefined,
    loading: true,
  })

  const setInitialState = async () => {
    if (agent) {
      if (options.connectionId) {
        const record = await agent.modules.actionMenu.findActiveMenu({
          connectionId: options.connectionId,
          role: DidCommActionMenuRole.Requester,
        })
        setState({ loading: false, menu: record?.menu })
      }
    }
  }

  useEffect(() => {
    setInitialState()
  }, [agent, options.connectionId])

  useEffect(() => {
    if (!state.loading) {
      const actionMenuAdded$ = recordsAddedByType(agent, DidCommActionMenuRecord).subscribe((record) => {
        if (record.connectionId === options.connectionId) {
          setState({ loading: state.loading, menu: record.menu })
        }
      })

      const actionMenuUpdated$ = recordsUpdatedByType(agent, DidCommActionMenuRecord).subscribe((record) => {
        if (record.connectionId === options.connectionId) {
          setState({ loading: state.loading, menu: record.menu })
        }
      })

      // This should not happen
      const actionMenuRemoved$ = recordsRemovedByType(agent, DidCommActionMenuRecord).subscribe((record) => {
        if (record.connectionId === options.connectionId) {
          setState({ loading: state.loading, menu: undefined })
        }
      })

      return () => {
        actionMenuAdded$?.unsubscribe()
        actionMenuUpdated$?.unsubscribe()
        actionMenuRemoved$?.unsubscribe()
      }
    }
  }, [state, agent, options.connectionId])

  return {
    loading: state.loading,
    menu: state.menu,
  }
}
