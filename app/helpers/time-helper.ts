import moment from 'moment'

const toMomentDuration = ({ time, unit = 'seconds' }: any) => {
  return moment.duration(time, unit)
}

const formatTimeHumanReadable = ({ time, unit = 'seconds', withSuffix = false }: any) => {
  const duration = toMomentDuration({
    time: time,
    unit: unit,
  })
  return duration.humanize(withSuffix)
}

const formatTime = ({ time, unit = 'seconds', withSuffix = false }: any) => {
  const duration = toMomentDuration({
    time: time,
    unit: unit,
  })
  return moment.utc(duration.asMilliseconds()).format('HH:mm:ss')
}

export { toMomentDuration, formatTimeHumanReadable, formatTime }
