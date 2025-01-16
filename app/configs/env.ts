let env: any = undefined
if (typeof process === 'object' && process !== undefined && process?.env) {
  env = process.env
}
export default env
