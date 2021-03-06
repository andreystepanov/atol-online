import axios from 'axios'
import underscore from 'underscore'
import isUrl from 'is-url'
import moment from 'moment'

const http = axios.create()

http.interceptors.response.use(
  res => {
    const { data } = res

    if (!data) {
      return Promise.reject(res)
    }

    if (
      ('token' in data && (data.code >= 2 || data.token === '')) ||
      (data.status === 'fail' || (data.error && data.error.code))
    ) {
      return Promise.reject(res)
    }

    return res
  },
  ({ response, ...error }) => {
    if (response) {
      error.statusText = response.statusText
      error.status = response.status
      error.headers = response.headers
      error.data = response.data
    }

    return Promise.reject(error)
  },
)

module.exports = class Atol {
  constructor(options = {}) {
    const optns = underscore.defaults(options, {
      livemode: true,
      login: process.env.ATOL_LOGIN,
      password: process.env.ATOL_PASSWORD,
      group: process.env.ATOL_GROUP,
      email: process.env.ATOL_COMPANY_EMAIL,
      inn: process.env.ATOL_COMPANY_INN,
      sno: process.env.ATOL_COMPANY_SNO,
      url: process.env.ATOL_COMPANY_URL,
      vat: process.env.ATOL_VAT || 'none',
      callback_url: null,
      supplier: null,
    })

    optns.agent = underscore.defaults(optns.agent || {}, {
      type: process.env.ATOL_AGENT_TYPE,
      phones: process.env.ATOL_AGENT_PHONES,
    })

    const agentTypes = [
      'bank_paying_agent',
      'bank_paying_subagent',
      'paying_agent',
      'paying_subagent',
      'attorney',
      'comission_agent',
      'another',
    ]

    const vats = {
      none: 'none',
      10: 'vat10',
      18: 'vat18',
      20: 'vat20',
      '10/110': 'vat110',
      '18/118': 'vat118',
    }

    const snoList = [
      'osn',
      'usn_income',
      'usn_income_outcome',
      'envd',
      'esn',
      'patent',
    ]

    if (!optns.login) {
      console.warn('WARN: Login is undefined, add your login')
    }

    if (!optns.password) {
      console.warn('WARN: Password is undefined, add your password')
    }

    if (!optns.group) {
      console.warn('WARN: Group is undefined, add your group')
    }

    if (!optns.inn) {
      console.warn('WARN: Inn is undefined, add your inn')
    }

    if (!optns.email) {
      console.warn('WARN: email is undefined, add your email')
    }

    if (!optns.url) {
      console.warn('WARN: Url is undefined, add your url')
    }

    if (!(optns.vat in vats)) {
      console.warn('WARN: Vat should be one of: ', Object.keys(vats).join())
    }

    const validAgentType = agentTypes.includes(optns.agent.type)

    if (optns.agent.type && validAgentType === false) {
      console.warn('WARN: Agent type should be one of: ', agentTypes.join())
    }

    this.login = optns.login
    this.password = optns.password
    this.group = optns.group
    this.company = {
      email: optns.email,
      inn: optns.inn,
      payment_address: optns.url,
    }
    this.agent = validAgentType ? Atol.prepareAgent(optns.agent) : null
    this._originalAgent = optns.agent

    this.supplier = Atol.prepareSupplier(optns.supplier)
    this._originalSupplier = optns.supplier

    if (optns.sno) {
      if (snoList.includes(optns.sno)) {
        this.company.sno = optns.sno
      } else {
        console.warn('WARN: SNO should be empty or one of: ', snoList.join())
      }
    }

    this.vatType = vats[optns.vat]
    this.apiToken = null
    this.apiVersion = 'v4'
    this.apiUrl = `https://${
      !!optns.livemode ? '' : 'test'
    }online.atol.ru/possystem/${this.apiVersion}`
    this.userAgent = 'Atol-Online-Node/0.1'
    this.paymentTypes = {
      online: 1,
      advance: 2,
      credit: 3,
      other: 4,
      custom: 5,
      custom_2: 6,
      custom_3: 7,
      custom_4: 8,
      custom_5: 9,
    }

    if (optns.callback_url) {
      this.callbackUrl = null

      // const pattern = /^http(s?):\/\/[0-9a-zA-Zа-яА-Я]([-.\w]*[0-9a-zA-Zа-яА-Я])*(:(0-9)*)*(\/?)([a-zA-Z0-9а-яА-Я-.?,'/+&=%$#_]*)?$/

      if (isUrl(optns.callback_url)) {
        this.callbackUrl = optns.callback_url
      } else {
        console.log('WARN: Callback url show be valid')
      }
    }

    this.sell = {
      create: this.sellCreate.bind(this),
      refund: this.sellRefund.bind(this),
      correction: this.sellCorrection.bind(this),
    }

    this.report = {
      get: this.getReport.bind(this),
    }
  }

  static formatResponse(res) {
    const {
      request: { _headers: reqHeaders, ...request },
      config: { sentAt, url, params, data },
      status,
      ...response
    } = res

    let requestBody

    try {
      requestBody = JSON.parse(data || null)
    } catch (err) {
      requestBody = null
    }

    const formattedResponse = {
      success: status === 200,
      request: {
        headers: request ? underscore.omit(reqHeaders, ['user-agent']) : null,
        url,
        params,
        body: requestBody,
      },
      response: {
        status,
        status_text: response.statusText,
        smoke_screen: !status,
        headers: response.headers,
        body: response.data,
        time: `${moment().diff(sentAt)} ms`,
      },
      created_at: sentAt.format(),
    }

    return formattedResponse
  }

  async call(
    method = 'get',
    endpoint = '',
    { data = null, params = null } = {},
  ) {
    const token = await this.authenticate()

    const options = {
      method,
      url: `${this.apiUrl}/${this.group}/${endpoint}`,
      data,
      params,
      headers: {
        'User-Agent': this.userAgent,
        Token: token,
      },
      sentAt: moment(),
    }

    return http
      .request(options)
      .then(Atol.formatResponse)
      .catch(Atol.formatResponse)
  }

  async authenticate() {
    if (this.apiToken) {
      // return this.apiToken
    }

    await http
      .post(
        `${this.apiUrl}/getToken`,
        {
          login: this.login,
          pass: this.password,
        },
        {
          headers: {
            'User-Agent': this.userAgent,
          },
        },
      )
      .then(res => {
        this.apiToken = res.data.token
        return res.data.token
      })
      .catch(error => Promise.reject(error.data))

    return this.apiToken
  }

  static timestamp(input = null, inputFormat = null) {
    const date = moment(input, inputFormat)
    return (date.isValid() ? date : moment()).format('DD.MM.YYYY HH:mm:ss')
  }

  static formatPhones(phones) {
    if (typeof phones === 'string') {
      return phones.replace(/[ ]/g, '').split(',')
    }

    return phones
  }

  static prepareAgent({ type, phones, ...rest } = {}) {
    const formattedPhones = Atol.formatPhones(phones)
    const agent = { type }

    const advancedTypes = [
      'paying_agent',
      'receive_payments_operator',
      'money_transfer_operator',
    ]

    const allowedFields = []

    if (type === 'paying_agent') {
      allowedFields.push('operation')
    } else if (type === 'money_transfer_operator') {
      allowedFields.push('name', 'address', 'inn')
    }

    if (advancedTypes.includes(type)) {
      agent[type] = {
        ...underscore.pick(rest, allowedFields),
        phones: formattedPhones,
      }
    }

    return agent
  }

  static prepareSupplier(data) {
    if (!data) {
      return null
    }

    const supplier = { ...data }
    supplier.phones = Atol.formatPhones(supplier.phones || null)

    return underscore.pick(supplier, ['phones', 'name', 'inn'])
  }

  preparePurchaseOrRefund({
    id,
    timestamp,
    timestamp_format: timestampFormat,
    customer: client,
    callback_url: callbackUrl,
    items: list = [],
    payment_type: paymentType = 'online',
  } = {}) {
    const items = this.prepareItems(list)
    const paymentTotal = items.reduce(
      (total, current) => parseFloat((total + current.sum).toFixed(2)),
      0,
    )

    const data = {
      external_id: id,
      receipt: {
        client,
        company: this.company,
        items,
        payments: [
          {
            type: this.paymentTypes[paymentType],
            sum: paymentTotal,
          },
        ],
        total: paymentTotal,
      },
      service: {
        callback_url: callbackUrl || this.callbackUrl,
      },
      timestamp: Atol.timestamp(timestamp, timestampFormat),
    }

    return data
  }

  prepareItems(items = []) {
    return items.map(
      ({
        type,
        payment,
        quantity = 1,
        unit_label: unitLabel,
        name,
        price: itemPrice = 0,
        agent = null,
        supplier = null,
      }) => {
        const price = parseFloat(itemPrice.toFixed(2))
        const sum = parseFloat((price * quantity).toFixed(2))
        const { vatType } = this
        const agentInfo =
          this.agent && agent !== false
            ? Atol.prepareAgent(underscore.defaults(agent, this._originalAgent))
            : null
        const supplierInfo = agentInfo
          ? Atol.prepareSupplier(
              underscore.defaults(supplier, this._originalSupplier),
            )
          : null

        const item = {
          name,
          price,
          quantity,
          sum,
          measurement_unit: unitLabel,
          payment_method: payment || 'full_prepayment', // full_payment
          payment_object: type || 'commodity',
          vat: {
            type: vatType,
            sum: Atol.vat(sum, vatType),
          },
          agent_info: agentInfo,
          supplier_info: supplierInfo,
        }

        if (!item.agent_info) {
          delete item.agent_info
          delete item.supplier_info
        }

        return item
      },
    )
  }

  prepareCorrection({
    id,
    amount = 0,
    instruction = false,
    number,
    // date,
    description,
    timestamp,
    vat,
    payment_type: paymentType = 'online',
    timestamp_format: timestampFormat,
    callback_url: callbackUrl,
  } = {}) {
    const vatType = vat || this.vatType
    const timestampDate = moment(timestamp || undefined, timestampFormat)
    return {
      external_id: id,
      correction: {
        company: this.company,
        correction_info: {
          type: instruction ? 'instruction' : 'self',
          base_date: timestampDate.format('DD.MM.YYYY'),
          base_number: number,
          base_name: description,
        },
        payments: [
          {
            type: this.paymentTypes[paymentType],
            sum: amount,
          },
        ],
        vats: [
          {
            type: vatType,
            sum: Atol.vat(amount, vatType),
          },
        ],
      },
      service: {
        callback_url: callbackUrl || this.callbackUrl,
      },
      timestamp: Atol.timestamp(timestampDate, timestampFormat),
    }
  }

  static vat(amount = 0, vatType) {
    const deviders = {
      vat10: 0.1,
      vat18: 0.18,
      vat20: 0.2,
    }

    if (vatType === 'none' || !(vatType in deviders)) {
      return 0
    }

    return parseFloat((amount * deviders[vatType]).toFixed(2))
  }

  sellCreate(payload) {
    const data = this.preparePurchaseOrRefund(payload)
    return this.call('post', 'sell', { data })
  }

  sellRefund(payload) {
    const data = this.preparePurchaseOrRefund(payload)
    return this.call('post', 'sell_refund', { data })
  }

  sellCorrection(payload) {
    const data = this.prepareCorrection(payload)
    return this.call('post', 'sell_correction', { data })
  }

  getReport(id) {
    return this.call('get', `report/${id}`)
  }

  static error(message) {
    return Promise.reject(new Error(message))
  }
}
