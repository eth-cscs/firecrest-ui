// env
import env from './env'
// helpers
import { getEnvVariable } from '~/helpers/env-helper'

const ui = {
  listPaginateLimit: getEnvVariable(env, 'UI_LIST_PAGINATE_LIMIT', false, 20),
  fileUploadLimit: getEnvVariable(env, 'FILE_UPLOAD_LIMIT', false, 5242880),
  fileDownloadLimit: getEnvVariable(env, 'FILE_DOWNLOAD_LIMIT', false, 5242880),
}

export default ui
