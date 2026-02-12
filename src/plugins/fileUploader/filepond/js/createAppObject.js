import { createApp } from './app'
import { getOptions } from './app/options'
import { forin } from './utils/forin'

export const createAppObject = (customOptions = {}) => {
  // default options
  const defaultOptions = {}

  forin(getOptions(), (key, value) => {
    defaultOptions[key] = value[0]
  })

  // set app options
  // return the plugin instance
  return createApp({
    // default options
    ...defaultOptions,

    // custom options
    ...customOptions,
  })
}
