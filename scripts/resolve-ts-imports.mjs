import { registerHooks } from "node:module"

const RELATIVE = /^\.\.?\//
const WITH_EXTENSION = /\.[cm]?[jt]sx?$/

registerHooks({
  resolve(specifier, context, nextResolve) {
    const fromTypeScript = context.parentURL?.endsWith(".ts") ?? false
    if (fromTypeScript && RELATIVE.test(specifier) && !WITH_EXTENSION.test(specifier)) return nextResolve(`${specifier}.ts`, context)
    return nextResolve(specifier, context)
  },
})
