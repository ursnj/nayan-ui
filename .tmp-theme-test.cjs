const WebSocket = require('ws')

const delay = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

async function run() {
  let version

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      version = await (
        await fetch('http://127.0.0.1:9223/json/version')
      ).json()
      break
    } catch {
      await delay(100)
    }
  }

  if (!version) throw new Error('Chrome DevTools endpoint did not start')

  const targets = await (
    await fetch('http://127.0.0.1:9223/json/list')
  ).json()
  const page = targets.find(target => target.type === 'page')
  const socket = new WebSocket(page.webSocketDebuggerUrl)

  await new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })

  let nextId = 0
  const pending = new Map()

  socket.on('message', rawMessage => {
    const message = JSON.parse(rawMessage)
    if (!message.id) return

    const waiter = pending.get(message.id)
    if (!waiter) return

    pending.delete(message.id)
    if (message.error) waiter.reject(new Error(message.error.message))
    else waiter.resolve(message.result)
  })

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })

  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    })

    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ??
          JSON.stringify(result.exceptionDetails)
      )
    }

    return result.result.value
  }

  const hasVisibleToggle = `Boolean(
    [...document.querySelectorAll('button[aria-label^="Switch to "]')]
      .find(button => button.offsetParent !== null)
  )`
  const inspect = `(() => {
    const button = [...document.querySelectorAll(
      'button[aria-label^="Switch to "]'
    )].find(candidate => candidate.offsetParent !== null)

    return {
      dataTheme: document.documentElement.getAttribute('data-theme'),
      darkClass: document.documentElement.classList.contains('dark'),
      lightClass: document.documentElement.classList.contains('light'),
      colorScheme: document.documentElement.style.colorScheme,
      storedTheme: localStorage.getItem('THEME'),
      buttonLabel: button?.getAttribute('aria-label'),
      buttonPressed: button?.getAttribute('aria-pressed')
    }
  })()`
  const clickVisibleToggle = `(() => {
    const button = [...document.querySelectorAll(
      'button[aria-label^="Switch to "]'
    )].find(candidate => candidate.offsetParent !== null)

    if (!button) throw new Error('Visible theme button not found')
    button.click()
    return true
  })()`

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  })
  await send('Page.navigate', { url: 'http://localhost:7100' })

  let toggleFound = false
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await evaluate(hasVisibleToggle)) {
      toggleFound = true
      break
    }
    await delay(100)
  }

  if (!toggleFound) {
    const diagnostics = await evaluate(`({
      location: location.href,
      readyState: document.readyState,
      buttonLabels: [...document.querySelectorAll('button')]
        .map(button => button.getAttribute('aria-label'))
        .filter(Boolean),
      bodyText: document.body.innerText.slice(0, 500)
    })`)
    throw new Error(`Theme button not found: ${JSON.stringify(diagnostics)}`)
  }

  const before = await evaluate(inspect)
  await evaluate(clickVisibleToggle)
  await delay(250)
  const afterToggle = await evaluate(inspect)

  await send('Page.reload', { ignoreCache: true })
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await evaluate(hasVisibleToggle)) break
    await delay(100)
  }

  const afterReload = await evaluate(inspect)
  await evaluate(clickVisibleToggle)
  await delay(250)
  const restored = await evaluate(inspect)

  console.log(
    JSON.stringify({ before, afterToggle, afterReload, restored }, null, 2)
  )
  socket.close()
}

run().catch(error => {
  console.error(error.stack || error)
  process.exitCode = 1
})
