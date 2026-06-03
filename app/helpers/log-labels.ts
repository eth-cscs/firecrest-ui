/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export const LogAction = {
  FS_CHMOD: 'fs.chmod',
  FS_CHOWN: 'fs.chown',
  FS_MKDIR: 'fs.mkdir',
  FS_RM: 'fs.rm',
  FS_SYMLINK: 'fs.symlink',
  FS_TAIL: 'fs.tail',
  FS_UPLOAD: 'fs.upload',
  FS_CHECKSUM: 'fs.checksum',
  FS_TRANSFER_CP: 'fs.transfer.cp',
  FS_TRANSFER_MV: 'fs.transfer.mv',
  FS_TRANSFER_DOWNLOAD: 'fs.transfer.download',
  FS_TRANSFER_UPLOAD: 'fs.transfer.upload',
  COMPUTE_JOB_SUBMIT_LOCAL: 'compute.job.submit.local',
  COMPUTE_JOB_SUBMIT_REMOTE: 'compute.job.submit.remote',
} as const

export const LogActionMessage: Record<string, string> = {
  'fs.chmod': 'File permission changed',
  'fs.chown': 'File ownership changed',
  'fs.mkdir': 'Directory created',
  'fs.rm': 'File removed',
  'fs.symlink': 'Symbolic link created',
  'fs.tail': 'File tail retrieved',
  'fs.upload': 'File uploaded',
  'fs.checksum': 'File checksum computed',
  'fs.transfer.cp': 'File transfer: copy',
  'fs.transfer.mv': 'File transfer: move',
  'fs.transfer.download': 'File transfer: download',
  'fs.transfer.upload': 'File transfer: upload (async)',
  'compute.job.submit.local': 'Job submitted via local script upload',
  'compute.job.submit.remote': 'Job submitted via remote script',
}

export const LogPage = {
  INDEX: 'Index page',
  FILESYSTEM_INDEX: 'Filesystem index page',
  FILESYSTEM_TRANSFER_INDEX: 'Filesystem transfer index page',
  COMPUTE_SUBMIT: 'Compute submit page',
  COMPUTE_JOB_DETAIL: 'Compute job detail page',
} as const

export const logPageLabel = {
  filesystemLayout: (system: string) => `Filesystems system ${system} layout page`,
  computeLayout: (system: string) => `Compute system ${system} layout page`,
  computeSystemIndex: (system: string) => `Compute system ${system} index page`,
  computeAccountIndex: (system: string, account: string) =>
    `Compute system ${system} account ${account} index page`,
}
