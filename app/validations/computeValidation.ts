import * as Yup from 'yup'
// types
import type { PostJobFormPayload } from '~/types/api-compute'
// validations
import { validateForm } from './baseValidation'

const MAX_FILE_SIZE = 102400 // TODO: Move this variable in env config
const validFileExtensions: any = { sbatch: ['sh'] }
const isValidFileType = (fileName: string, fileType: string) => {
  if (fileName) {
    return validFileExtensions[fileType].indexOf(fileName.split('.').pop()) > -1
  }
  return false
}

const jobSchema: Yup.ObjectSchema<PostJobFormPayload> = Yup.object({
  system: Yup.string().required('System is required'),
  file: Yup.mixed()
    .required('Batch file is required')
    .test('is-valid-type', 'Not a valid batch file type (.sh)', (value: any) => {
      return isValidFileType(value && value.name.toLowerCase(), 'sbatch')
    })
    .test(
      'is-valid-size',
      'Max allowed size is 100KB',
      (value: any) => value && value.size <= MAX_FILE_SIZE,
    ),
  name: Yup.string().optional(),
  workingDirectory: Yup.string().required('Working directory is required'),
  standardInput: Yup.string().optional(),
  standardOutput: Yup.string().optional(),
  standardError: Yup.string().optional(),
  environment: Yup.string()
    .optional()
    .test('json', 'Invalid environment dictionary. Expected <string,string> format', (value) => {
      try {
        const json = value ? value : '{}'
        const environment: Record<string, string> = JSON.parse(json)
        Object.keys(environment).forEach((key) => {
          if (typeof environment[key] != 'string') {
            throw new TypeError('Not a string value')
          }
        })
        return true
      } catch (error) {
        return false
      }
    }),
})

export const validateJob = async (formData: FormData): Promise<PostJobFormPayload> => {
  return validateForm(formData, jobSchema)
}
