/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import * as Yup from 'yup'
// types
import type {
  PostTransferCpRequest,
  PostTransferMvRequest,
  PostTransferUploadRequest,
  PostTransferDownloadRequest,
} from '~/types/api-filesystem'
// helpers
import { FILE_PATH_REGEXP } from '~/helpers/file-helper'
// validations
import { validateForm } from './baseValidation'

const transferCpSchema: Yup.ObjectSchema<PostTransferCpRequest> = Yup.object({
  sourcePath: Yup.string()
    .required('Source path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Source path should be a valid PATH'),
  targetPath: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
})

export const validateTransferCp = async (formData: FormData): Promise<PostTransferCpRequest> => {
  return validateForm(formData, transferCpSchema)
}

const transferMvSchema: Yup.ObjectSchema<PostTransferMvRequest> = Yup.object({
  sourcePath: Yup.string()
    .required('Source path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Source path should be a valid PATH'),
  targetPath: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
})

export const validateTransferMv = async (formData: FormData): Promise<PostTransferMvRequest> => {
  return validateForm(formData, transferMvSchema)
}

const transferUploadSchema: Yup.ObjectSchema<PostTransferUploadRequest> = Yup.object({
  fileName: Yup.string()
  .required('FileName is required'),
  path: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
})

const transferDownloadSchema: Yup.ObjectSchema<PostTransferDownloadRequest> = Yup.object({
  path: Yup.string()
    .required('Source path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
})

export const validateTransferUpload = async (
  formData: FormData,
): Promise<PostTransferUploadRequest> => {
  return validateForm(formData, transferUploadSchema)
}

export const validateTransferDownload = async (
  formData: FormData,
): Promise<PostTransferDownloadRequest> => {
  return validateForm(formData, transferDownloadSchema)
}
