/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import * as Yup from 'yup'
// types
import type {
  PutOpsChownRequest,
  PutOpsChmodRequest,
  PostOpsSymlinkRequest,
  DeleteOpsRmRequest,
  PostOpsMkdirRequest,
} from '~/types/api-filesystem'
// helpers
import { FILE_PATH_REGEXP, CHMOD_REGEXP } from '~/helpers/file-helper'
// validations
import { validateForm } from './baseValidation'

const opsSymlinkSchema: Yup.ObjectSchema<PostOpsSymlinkRequest> = Yup.object({
  targetPath: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
  linkPath: Yup.string()
    .required('Link path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Link path should be a valid PATH'),
})

export const validateOpsSymlink = async (formData: FormData): Promise<PostOpsSymlinkRequest> => {
  return validateForm(formData, opsSymlinkSchema)
}

const opsChownSchema: Yup.ObjectSchema<PutOpsChownRequest> = Yup.object({
  targetPath: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
  owner: Yup.string().nullable(),
  group: Yup.string().nullable(),
})

export const validateOpsChown = async (formData: FormData): Promise<PutOpsChownRequest> => {
  return validateForm(formData, opsChownSchema)
}

const opsChmodSchema: Yup.ObjectSchema<PutOpsChmodRequest> = Yup.object({
  targetPath: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
  mode: Yup.string()
    .required()
    .length(3)
    .matches(new RegExp(CHMOD_REGEXP), 'Mode should be a valid numeric mode of linux chmod tool'),
})

export const validateOpsChmod = async (formData: FormData): Promise<PutOpsChmodRequest> => {
  return validateForm(formData, opsChmodSchema)
}

const opsRmSchema: Yup.ObjectSchema<DeleteOpsRmRequest> = Yup.object({
  fileTargetPath: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
})

export const validateOpsRm = async (formData: FormData): Promise<DeleteOpsRmRequest> => {
  return validateForm(formData, opsRmSchema)
}

const opsMkdirSchema: Yup.ObjectSchema<PostOpsMkdirRequest> = Yup.object({
  path: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
})

export const validateOpsMkdir = async (formData: FormData): Promise<PostOpsMkdirRequest> => {
  return validateForm(formData, opsMkdirSchema)
}
