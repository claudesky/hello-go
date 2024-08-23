class ChatBox extends HTMLElement {
  template = /*html*/`
    <div id="status">Initializing...</div>
    <div id="message-box"></div>
    <template id="message">
      <span id="content">message</span>
    </template>
    <form action="javascript:void(0);" id="message-form">
      <input type="text" id="message-input" />
    </form>
    <style>
      /* Scoped Style (when shadow dom) */
      #message-box {
        border: solid 1px black;
        height: 100px;
        display: block;
        overflow-y: scroll;
      }

      #message-form {
      }
    </style>
  `

  constructor() {
    super()
    console.debug('initializing chat box template')

    /** @type {HTMLTemplateElement} */
    const template = document.createElement('template')
    template.innerHTML = this.template

    this.shadowRoot = this.attachShadow({ mode: 'closed' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  /** @type {WebSocket} */
  socketConnection
  shadowRoot

  /**
   * @param {MessageEvent} messageEvent
   */
  handleMessage = (messageEvent) => {
    this.messages.push(messageEvent.data)
    this.render()
  }

  /**
   * @param {SubmitEvent} submitEvent
   */
  sendMessage = () => {
    this.socketConnection.send(this.messageInput.value)
    this.messageInput.value = ''
    this.render()
  }

  messages = []
  /** @type {HTMLDivElement} */
  messageBox
  /** @type {HTMLInputElement} */
  messageInput
  /** @type {HTMLDivElement} */
  status

  /**
   * @param {string} status
   */
  setStatus = (status) => {
    this.status.innerText = status
  }

  /**
   */
  render = () => {
    this.messageBox.innerHTML = ''
    this.messages.forEach((m) => {
      const messageElement = document.createElement('div', {})
      messageElement.textContent = m
      this.messageBox.appendChild(messageElement)
      messageElement.scrollIntoView()
    })
  }

  initTemplate = () => {
    const root = this.shadowRoot
    this.messageBox = root.getElementById('message-box')
    this.messageInput = root.getElementById('message-input')
    this.status = root.getElementById('status')
  }

  /**
   */
  initEventListeners = () => {
    /** @type {HTMLFormElement} */
    const form = this.shadowRoot.getElementById('message-form')

    form.onsubmit = this.sendMessage
  }

  // 0 = keep retrying
  retryCount = 3
  retryDelaySec = 5

  handleConnectionError = () => {
    new Promise((resolve) => {
      this.socketConnection.close()
      this.retryCount--
      if (this.retryCount != 0) {
        // Wait for retryDelay sec while updating the status message
        let wait = this.retryDelaySec
        new Promise((resolve) => {
          this.setStatus(`Connection failed. Retrying in ${wait}s.`)
          const timer = setInterval(() => {
            wait--
            if (wait < 1) resolve(timer)
            else
              this.setStatus(`Connection failed. Retrying in ${wait}s.`)
          }, 1000)
        }).then((timer) => {
          this.setStatus(
            'Retrying connection...' +
              (this.retryCount > 0
                ? ` (${this.retryCount} attempts left.)`
                : ` (attempt #${1 - this.retryCount})`)
          )
          clearInterval(timer)
          resolve(this.initSocket())
        })
      } else {
        reject(ev)
      }
    })
  }

  /**
   *
   */
  initSocket = () => {
    return new Promise((resolve) => {
      const websocketURL =
        this.attributes.getNamedItem('websocket').textContent

      if (websocketURL === null) {
        let error_message =
          'The [websocket] attribute was not set on the chat-box element.'
        this.setStatus(error_message)
        throw new Error(error_message)
      }

      this.socketConnection = new WebSocket(websocketURL, ['access_token', 'test'])

      this.socketConnection.onopen = (ev) => {
        console.debug('websocket connected')
        this.setStatus('Waiting for messages...')
        resolve()
      }

      this.socketConnection.onerror = () =>
        resolve(this.handleConnectionError())

      this.socketConnection.onmessage = this.handleMessage

      this.socketConnection.onclose = () => {
        this.socketConnection = undefined
      }
    })
  }

  async connectedCallback() {
    this.initTemplate()
    await this.initSocket()
    this.initEventListeners()
  }
}

customElements.define(
  document.currentScript.getAttribute('componentSelector') || 'chat-box',
  ChatBox
)
