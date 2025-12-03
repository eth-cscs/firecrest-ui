/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useNavigate } from '@remix-run/react'

// contexts
import { useGroup } from '~/contexts/GroupContext'

// TODO: improve the UI/UX of this switcher and implement the redirect upon switch
const GroupSwitcher: React.FC<any> = () => {
  const navigate = useNavigate()

  const { groups, selectedGroup } = useGroup()

  const handleSwitch = (groupId: string) => {
    navigate(`/tbd`)
  }

  return (
    <select value={selectedGroup?.id ?? ''} onChange={(e) => handleSwitch(e.target.value)}>
      {groups.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )
}

export default GroupSwitcher
