import React from 'react'

interface NewLineTextProps {
  text: string
}

const NewLineText: React.FC<NewLineTextProps> = ({ text }: NewLineTextProps) => {
  const newText = text.split('\n').map((str, index) => <p key={index}>{str}</p>)

  return <>{newText}</>
}

export default NewLineText
