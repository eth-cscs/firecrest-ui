/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

const validateForm = async (formData: FormData, schema: any) => {
  // Convert form into JSON object
  const formJSON: { [key: string]: any } = {}
  for (const key of formData.keys()) {
    formJSON[key] = formData.get(key)
  }
  // Validate the object and throw error if not valid
  const validationResult = await schema.validate(formJSON, { abortEarly: false })
  return validationResult
}

export { validateForm }
