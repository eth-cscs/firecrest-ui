const classNames = (...classes: Array<string>) => {
  return classes.filter(Boolean).join(' ')
}

export { classNames }
