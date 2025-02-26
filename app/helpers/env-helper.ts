/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export const getEnvVariable = (
  env: any,
  variableName: string,
  mandatory: boolean = true,
  defaultValue: any = null,
  isBoolean: boolean = false,
) => {
  if (env !== undefined) {
    let variable = env[variableName]
    if (variable === undefined && mandatory) {
      throw new Error(`${variableName} must be set`)
    }
    if (isBoolean) {
      if (variable === undefined) {
        return defaultValue
      }
      if (variable === 'true' || variable === 'True' || variable === 'yes' || variable === 'Yes') {
        variable = true
      } else {
        variable = false
      }
      return variable
    }
    return variable || defaultValue
  }
  return defaultValue
}
