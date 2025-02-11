/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export enum ColumnType {
  SORTABLE,
  ACTION,
}

export enum SortableColumn {
  NONE,
  UP,
  DOWN,
}

export enum FileTableColumns {
  FILE_NAME = 'name',
  LAST_MODIFIED = 'lastModified',
  FILE_SIZE = 'size',
  GROUP = 'group',
  OWNER = 'user',
  PERMISSION = 'permission',
  ACTION = 'action',
}
