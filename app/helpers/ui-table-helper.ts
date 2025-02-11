/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { SortableColumn, FileTableColumns, ColumnType } from '~/types/ui-tables'

export class FileTableSortableColumn {
  columnName: FileTableColumns
  columnLabel: string
  columnSortable: SortableColumn
  columnType: ColumnType

  constructor(
    columnName: FileTableColumns,
    columnLabel: string,
    columnSortable: SortableColumn,
    columnType: ColumnType,
  ) {
    this.columnName = columnName
    this.columnLabel = columnLabel
    this.columnSortable = columnSortable
    this.columnType = columnType
  }

  static getDefault(): FileTableSortableColumn {
    return getFileTableSortableColumns()[0]
  }

  static fromJSON(d: any): FileTableSortableColumn {
    try {
      return Object.assign(FileTableSortableColumn.getDefault(), d)
    } catch (e) {
      return FileTableSortableColumn.getDefault()
    }
  }
}

export const getFileTableSortableColumns = () => {
  return [
    new FileTableSortableColumn(
      FileTableColumns.FILE_NAME,
      'File name',
      SortableColumn.DOWN,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.LAST_MODIFIED,
      'Last modified',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.FILE_SIZE,
      'File size',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.GROUP,
      'Group',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.OWNER,
      'Owner',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.PERMISSION,
      'Permission',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.ACTION,
      'Action',
      SortableColumn.NONE,
      ColumnType.ACTION,
    ),
  ]
}

export const getFileBroserSortableColumns = () => {
  return [
    new FileTableSortableColumn(
      FileTableColumns.FILE_NAME,
      'File name',
      SortableColumn.DOWN,
      ColumnType.SORTABLE,
    ),
    // new FileTableSortableColumn(
    //   FileTableColumns.LAST_MODIFIED,
    //   'Last modified',
    //   SortableColumn.NONE,
    //   ColumnType.SORTABLE,
    // ),
    new FileTableSortableColumn(
      FileTableColumns.FILE_SIZE,
      'File size',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.GROUP,
      'Group',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    new FileTableSortableColumn(
      FileTableColumns.OWNER,
      'Owner',
      SortableColumn.NONE,
      ColumnType.SORTABLE,
    ),
    // new FileTableSortableColumn(
    //   FileTableColumns.PERMISSION,
    //   'Permission',
    //   SortableColumn.NONE,
    //   ColumnType.SORTABLE,
    // ),
    new FileTableSortableColumn(
      FileTableColumns.ACTION,
      'Action',
      SortableColumn.NONE,
      ColumnType.ACTION,
    ),
  ]
}

export const nextSortState = (currentSortState: SortableColumn) => {
  switch (currentSortState) {
    case SortableColumn.UP:
      return SortableColumn.DOWN
    case SortableColumn.DOWN:
      return SortableColumn.UP
    default:
      return SortableColumn.UP
  }
}

export const getUpdatedStateFileTableSortableColumns = (
  currentFileTableSortableColumns: FileTableSortableColumn[],
  selectedFileTableSortableColumn: FileTableSortableColumn,
): FileTableSortableColumn[] => {
  const newStatus: FileTableSortableColumn[] = currentFileTableSortableColumns.map(
    (fileTableSortableColumn: FileTableSortableColumn) => {
      const currentState =
        fileTableSortableColumn.columnName === selectedFileTableSortableColumn.columnName
          ? selectedFileTableSortableColumn.columnSortable
          : SortableColumn.NONE
      return new FileTableSortableColumn(
        fileTableSortableColumn.columnName,
        fileTableSortableColumn.columnLabel,
        currentState,
        fileTableSortableColumn.columnType,
      )
    },
  )
  return newStatus
}

export const getFileTableSortableColumn = (
  fileTableSortableColumn: FileTableSortableColumn,
  fileSystemObjects: any,
) => {
  let compareFunction
  switch (fileTableSortableColumn.columnName) {
    case FileTableColumns.FILE_NAME:
      compareFunction = (f1: any, f2: any) => f1.name.localeCompare(f2.name)
      break
    case FileTableColumns.LAST_MODIFIED:
      compareFunction = (f1: any, f2: any) => {
        return f1.lastModified.localeCompare(f2.lastModified)
      }
      break
    case FileTableColumns.GROUP:
      compareFunction = (f1: any, f2: any) => f1.group.localeCompare(f2.group)
      break
    case FileTableColumns.OWNER:
      compareFunction = (f1: any, f2: any) => {
        return f1.user.localeCompare(f2.user)
      }
      break
    case FileTableColumns.FILE_SIZE:
      compareFunction = (f1: any, f2: any) => {
        return f1.size - f2.size
      }
      break
    default:
      compareFunction = (f1: any, f2: any) => f1.name.localeCompare(f2.name)
  }
  // fileSystemObjects.sort((f1: any, f2: any) => f1.name.localeCompare(f2.name))
  const sortedTable =
    fileTableSortableColumn.columnSortable == SortableColumn.UP
      ? fileSystemObjects.sort(compareFunction).reverse()
      : fileSystemObjects.sort(compareFunction)
  return sortedTable
}
