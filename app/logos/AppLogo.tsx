/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'

const AppLogo: React.FC<any> = ({ className, logoPath }: any) => {
  return (
    <div
      className={className}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <img
        src={logoPath}
        alt='Logo'
        style={{
          maxWidth: '100%',
          height: 'auto',
          minWidth: '50px',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}

export default AppLogo
