/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import * as Yup from 'yup'
// types
import type { PostFileUploadPayload } from '~/types/api-filesystem'
// helpers
import { FILE_PATH_REGEXP, prettyBytes } from '~/helpers/file-helper'
// validations
import { validateForm } from './baseValidation'

const buildFileUploadSchema = (maxFileSize: number): Yup.ObjectSchema<PostFileUploadPayload> =>
  Yup.object({
    path: Yup.string()
      .required('Target path is required')
      .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
    file: Yup.mixed()
      .required('File is required')
      .test(
        'is-valid-size',
        `Max allowed size is ${prettyBytes(maxFileSize)}`,
        (value: any) => value && value.size <= maxFileSize,
      ),
  })

export const validateFileUpload = async (
  formData: FormData,
  maxFileSize: number,
): Promise<PostFileUploadPayload> => {
  return validateForm(formData, buildFileUploadSchema(maxFileSize))
}
