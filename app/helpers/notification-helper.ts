import { v4 as uuidv4 } from 'uuid'
// types
import type { NotificationMessage } from '~/types/notification'
import { NotificationMessageType } from '~/types/notification'
// utils
import { getSession, commitSession } from '~/utils/session.server'

const SESSION_KEY = 'notificationMessages'

const buildNotificationMessage = (
  title: string,
  text: string,
  code: string,
  type: NotificationMessageType,
  additional = {},
): NotificationMessage => {
  return {
    uuid: uuidv4(),
    type: type,
    code: code,
    title: title,
    text: text,
    additional: additional,
    displayed: false,
  }
}

export const notifyMessage = async (
  { title, text, code, type, additional = {} }: any,
  request: Request,
  headers = new Headers(),
) => {
  const notificationMessage = buildNotificationMessage(title, text, code, type, additional)
  const session = await getSession(request.headers.get('Cookie'))
  const notificationMessages = session.has(SESSION_KEY) ? session.get(SESSION_KEY) : []
  notificationMessages.push(notificationMessage)
  session.flash(SESSION_KEY, notificationMessages)
  headers.append('Set-Cookie', await commitSession(session))
  return notificationMessage
}

export const notifyInfoMessage = async (
  { title, text, code, additional = {} }: any,
  request: Request,
  headers = new Headers(),
) => {
  return notifyMessage(
    {
      title: title,
      text: text,
      code: code,
      type: NotificationMessageType.info,
      additional: additional,
    },
    request,
    headers,
  )
}

export const notifySuccessMessage = async (
  { title, text, code, additional = {} }: any,
  request: Request,
  headers = new Headers(),
) => {
  return notifyMessage(
    {
      title: title,
      text: text,
      code: code,
      type: NotificationMessageType.success,
      additional: additional,
    },
    request,
    headers,
  )
}

export const notifyWarningMessage = async (
  { title, text, code, additional = {} }: any,
  request: Request,
  headers = new Headers(),
) => {
  return notifyMessage(
    {
      title: title,
      text: text,
      code: code,
      type: NotificationMessageType.warning,
      additional: additional,
    },
    request,
    headers,
  )
}

export const notifyErrorMessage = async (
  { title, text, code, additional = {} }: any,
  request: Request,
  headers = new Headers(),
) => {
  return notifyMessage(
    {
      title: title,
      text: text,
      code: code,
      type: NotificationMessageType.error,
      additional: additional,
    },
    request,
    headers,
  )
}

export const getNotificationMessage = async (request: Request, headers: Headers) => {
  const session = await getSession(request.headers.get('Cookie'))
  let notificationMessages = []
  if (session.has(SESSION_KEY)) {
    notificationMessages = session.get(SESSION_KEY)
  }
  headers.append('Set-Cookie', await commitSession(session))
  return notificationMessages
}
