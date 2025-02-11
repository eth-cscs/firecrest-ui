/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

const classNames = (...classes: Array<string>) => {
  return classes.filter(Boolean).join(' ')
}

export { classNames }
