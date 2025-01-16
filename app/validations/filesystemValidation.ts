import * as Yup from 'yup'
// types
import type { PostFileUploadPayload } from '~/types/api-filesystem'
// helpers
import { FILE_PATH_REGEXP } from '~/helpers/file-helper'
// validations
import { validateForm } from './baseValidation'
// configs
import uiConfig from '~/configs/ui.config'

const fileUploadSchema: Yup.ObjectSchema<PostFileUploadPayload> = Yup.object({
  //   system: Yup.string().required('System is required'),
  path: Yup.string()
    .required('Target path is required')
    .matches(new RegExp(FILE_PATH_REGEXP), 'Target path should be a valid PATH'),
  file: Yup.mixed()
    .required('File is required')
    .test(
      'is-valid-size',
      'Max allowed size is 5MB',
      (value: any) => value && value.size <= uiConfig.fileUploadLimit,
    ),
})

export const validateFileUpload = async (formData: FormData): Promise<PostFileUploadPayload> => {
  return validateForm(formData, fileUploadSchema)
}
