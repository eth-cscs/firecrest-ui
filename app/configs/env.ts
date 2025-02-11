/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

let env: any = undefined
if (typeof process === 'object' && process !== undefined && process?.env) {
  env = process.env
}
export default env
