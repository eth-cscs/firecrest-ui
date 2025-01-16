const getErrorField = ({ fieldName, formErrorFields }: any) => {
  if (formErrorFields && formErrorFields.length > 0) {
    return formErrorFields.find((formErrorField: any) => formErrorField.name === fieldName)
  }
  return undefined
}

export const hasErrorForField = ({ fieldName, formErrorFields }: any) => {
  const errorField = getErrorField({
    fieldName: fieldName,
    formErrorFields: formErrorFields,
  })
  return errorField !== undefined
}

export const showInputValidation = ({ fieldName, formErrorFields }: any) => {
  const errorField = getErrorField({
    fieldName: fieldName,
    formErrorFields: formErrorFields,
  })
  return <>{errorField && <div className='mt-1 text-xs text-red-500 '>{errorField.message}</div>}</>
}
