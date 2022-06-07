pinky = require '../lib'

module.exports = global.pinky-adapter = do
                                        fulfilled: pinky
                                        rejected:  (value) -> pinky!reject value
                                        pending:           -> do
                                                              p = pinky!
                                                              promise: p
                                                              fulfill: p.fulfill
                                                              reject:  p.reject