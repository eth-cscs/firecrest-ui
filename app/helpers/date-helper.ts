/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import moment from 'moment'

const toMomentDate = ({ date }: any) => {
  return moment(date)
}

const formatDate = ({ date, format = 'DD-MM-YYYY' }: any) => {
  const m = moment(date)
  return m.format(format)
}

const formatDateTime = ({ dateTime, format = 'DD-MM-YYYY HH:mm:ss' }: any) => {
  if (!dateTime) {
    return 'N/A'
  }
  const m = moment(dateTime)
  return m.format(format)
}

const formatDateTimeFromTimestamp = ({ timestamp, format = 'DD-MM-YYYY HH:mm:ss' }: any) => {
  if (!timestamp) {
    return 'N/A'
  }
  const m = moment.unix(timestamp)
  return m.format(format)
}

const formatDateTimeFromNow = ({ dateTime, isUTC = false }: any) => {
  const m = isUTC ? moment.utc(dateTime) : moment(dateTime)
  return m.fromNow()
}

const formatTimestampFromNow = ({ timestamp }: any) => {
  const m = moment.unix(timestamp)
  return m.fromNow()
}

export {
  toMomentDate,
  formatDate,
  formatDateTime,
  formatDateTimeFromTimestamp,
  formatDateTimeFromNow,
  formatTimestampFromNow,
}
