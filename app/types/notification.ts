/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export enum NotificationMessageType {
  info = 'info',
  success = 'success',
  warning = 'warning',
  error = 'error',
}

export enum NotificationMessageCategory {
  application = 'application',
  httpRequest = 'httpRequest',
}

export interface NotificationMessage {
  uuid: string
  title: string
  text: string
  code: string
  type: NotificationMessageType
  additional: any
  displayed: boolean
}
