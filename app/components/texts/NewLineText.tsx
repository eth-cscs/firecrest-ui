/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React from 'react'

interface NewLineTextProps {
  text: string
}

const NewLineText: React.FC<NewLineTextProps> = ({ text }: NewLineTextProps) => {
  const newText = text.split('\n').map((str, index) => <p key={index}>{str}</p>)

  return <>{newText}</>
}

export default NewLineText
