import moment from 'moment'
import uuid from 'uuid/v4'
import Atol from './index'

require('dotenv').config()

const timestampWithoutSecondsFormat = 'DD.MM.YYYY HH:mm'
const timestampFormat = `${timestampWithoutSecondsFormat}:ss`

const options = {
  email: 'support@domain.ru',
  url: 'https://domain.ru',
  callback_url: 'https://domain.ru/callback',
  vat: 18,
  livemode: false,
}

const payload = {
  id: 'order_id',
  customer: {
    email: 'example@domain.ru',
    phone: '+79627772211',
  },
  items: [
    {
      type: 'service',
      name: 'Товар 1',
      price: 100.0,
      quantity: 2,
      unit_label: 'шт.',
      payment: null,
    },
    {
      type: 'service',
      name: 'Товар 2',
      price: 50.0,
      unit_label: 'шт.',
      payment: null,
    },
  ],
  // agent: {
  //   phones: [],
  //   name: '', // для money_transfer_operator
  //   address: '', // для money_transfer_operator
  // }
  // payment_type: 'online',
}

const correctionPayload = {
  id: 'correction_id',
  amount: 100.0,
  number: 'base_number',
  description: 'Описание коррекции',
  instruction: true,
  payment_type: 'advance',
}

const generatePayload = data => ({
  ...(data || payload),
  id: uuid(),
})

const correction = () => generatePayload(correctionPayload)

const log = jest.fn()

let atol
let atolAgent

// const instance = new Atol({})

beforeEach(() => {
  atol = new Atol(options)
  atolAgent = new Atol({
    ...options,
    agent: {
      type: 'paying_agent',
      operation: 'Комиссия за использование сервиса',
      phones: '+79627772211, +79627772200',
    },
    supplier: {
      name: 'ООО «Ромашка»',
      phones: '+79627772211, +79627772200',
      inn: '454545454545',
    },
  })
})

test('Atol exists', () => {
  expect(Atol).toBeDefined()
})

test('sets correct options', () => {
  expect(atolAgent).toMatchSnapshot()
})

describe('authenticate', () => {
  test('exists', async () => {
    expect(atol.authenticate).toBeDefined()
    expect(typeof atol.authenticate).toBe('function')
  })

  test.skip('send valid params', async () => {
    const result = await atol.authenticate()
  })
})

describe('timestamp', () => {
  test('timestamp', async () => {
    expect(Atol.timestamp).toBeDefined()
    expect(typeof Atol.timestamp).toBe('function')
  })

  test('returns formatted date from input', () => {
    const date = moment().subtract(1, 'year')
    const timestamp = Atol.timestamp(date.format())

    expect(timestamp).toEqual(date.format(timestampFormat))
  })

  test('returns default formatted date', () => {
    const timestamp = Atol.timestamp()

    expect(
      moment(timestamp, timestampFormat).format(timestampWithoutSecondsFormat),
    ).toEqual(moment().format(timestampWithoutSecondsFormat))
  })
})

describe('preparePurchaseOrRefund', () => {
  test('exists', async () => {
    expect(atol.preparePurchaseOrRefund).toBeDefined()
    expect(typeof atol.preparePurchaseOrRefund).toBe('function')
  })

  test.skip('throws error if id not provided', async () => {
    const result = await atol
      .preparePurchaseOrRefund({
        ...payload,
        id: undefined,
      })
      .catch(error => error)
  })

  test('returns prepared data', async () => {
    const { timestamp, ...result } = await atol.preparePurchaseOrRefund(payload)

    expect(timestamp).toBeDefined()
    expect(result).toMatchSnapshot()
  })

  test('sets custom timestamp and callback_url', async () => {
    const timestamp = moment('2017-11-28T23:49:45+07:00').format(
      timestampFormat,
    )
    const callbackUrl = `${options.callback_url}/new`

    const result = await atol.preparePurchaseOrRefund({
      ...payload,
      callback_url: callbackUrl,
      timestamp,
      timestamp_format: timestampFormat,
    })

    expect(result.timestamp).toEqual(timestamp)
    expect(result).toMatchSnapshot()
  })

  test('sets agent info', async () => {
    const { timestamp, ...result } = await atolAgent.preparePurchaseOrRefund({
      ...payload,
    })

    expect(result).toMatchSnapshot()
  })

  test('rewrites default agent and supplier info', async () => {
    const { timestamp, ...result } = await atolAgent.preparePurchaseOrRefund({
      ...payload,
      items: payload.items.map(item => ({
        ...item,
        agent: {
          phones: '+79627772200',
        },
        supplier: {
          phones: '+79627772200',
        },
      })),
    })

    expect(result).toMatchSnapshot()
  })
})

describe('prepareAgent', () => {
  const agentPhones = `${payload.customer.phone},${payload.customer.phone}`

  test('exists', async () => {
    expect(Atol.prepareAgent).toBeDefined()
    expect(typeof Atol.prepareAgent).toBe('function')
  })

  test('returns prepared data for `paying_agent`', async () => {
    const agent = Atol.prepareAgent({
      type: 'paying_agent',
      phones: agentPhones,
      operation: 'Some operation',
      extra_field: true,
    })

    expect(agent).toMatchSnapshot()
  })

  test('returns prepared data for `receive_payments_operator`', async () => {
    const agent = Atol.prepareAgent({
      type: 'receive_payments_operator',
      phones: agentPhones,
      extra_field: true,
    })

    expect(agent).toMatchSnapshot()
  })

  test('returns prepared data for `money_transfer_operator`', async () => {
    const agent = Atol.prepareAgent({
      type: 'money_transfer_operator',
      phones: agentPhones,
      name: 'Some name',
      address: 'Some address',
      inn: 'Some INN',
      extra_field: true,
    })

    expect(agent).toMatchSnapshot()
  })

  test('returns prepared data other types', async () => {
    const agent = Atol.prepareAgent({
      type: 'another',
      phones: agentPhones,
      extra_field: true,
    })

    expect(agent).toMatchSnapshot()
  })
})

describe('prepareItems', () => {
  test('returns simple prepared items', () => {
    const preItems = atol.prepareItems(payload.items)

    expect(preItems).toMatchSnapshot()
  })

  test('returns prepared items for agents', () => {
    const preItems = atolAgent.prepareItems(payload.items)

    expect(preItems).toMatchSnapshot()
  })

  test('returns prepared items (agent data ignored)', () => {
    const preItems = atolAgent.prepareItems(
      payload.items.map(item => ({
        ...item,
        agent: false,
      })),
    )

    expect(preItems).toMatchSnapshot()
  })
})

describe('prepareSupplier', () => {
  const supplierPhones = `${payload.customer.phone},${payload.customer.phone}`

  test('exists', async () => {
    expect(Atol.prepareSupplier).toBeDefined()
    expect(typeof Atol.prepareSupplier).toBe('function')
  })

  test('returns prepared supplier', async () => {
    const supplier = Atol.prepareSupplier({
      name: 'Supplier name',
      phones: supplierPhones,
      inn: 'Supplier inn',
      extra_field: true, // ignored
    })

    expect(supplier).toMatchSnapshot()
  })
})

describe('prepareCorrection', () => {
  const timestamp = moment('2017-11-28T23:49:45+07:00').format(timestampFormat)

  test('exists', async () => {
    expect(atol.prepareCorrection).toBeDefined()
    expect(typeof atol.prepareCorrection).toBe('function')
  })

  test('returns prepared data', async () => {
    const { timestamp, ...result } = await atol.prepareCorrection(
      correctionPayload,
    )
    const { base_date: baseDate } = result.correction.correction_info
    result.correction.correction_info.base_date = '[sanitized]'

    expect(timestamp).toBeDefined()
    expect(baseDate).toBeDefined()
    expect(result).toMatchSnapshot()
  })

  test('sets custom timestamp and callback_url', async () => {
    const timestamp = moment('2017-11-28T23:49:45+07:00').format(
      timestampFormat,
    )
    const callbackUrl = `${options.callback_url}/new`

    const result = await atol.prepareCorrection({
      ...correctionPayload,
      callback_url: callbackUrl,
      timestamp,
      timestamp_format: timestampFormat,
    })

    expect(result.timestamp).toEqual(timestamp)
    expect(result).toMatchSnapshot()
  })
})

describe.skip(
  'sending real request to API',
  () => {
    describe('sell and report', () => {
      let externalId
      let sellId

      test('returns validation error', async () => {
        const { success, response } = await atol.sell
          .create({})
          .catch(error => error)

        expect(success).toBe(false)
        expect(response.status).toBe(400)
        expect(response.body.status).toMatchSnapshot('fail')
        expect(response.body.error.text).toMatchSnapshot()
      })

      test('returns successful response', async () => {
        const data = generatePayload()
        const { success, response } = await atol.sell
          .create(data)
          .catch(error => error)

        expect(success).toBe(true)

        expect(response.status).toBe(200)
        expect(response.body.uuid).toBeDefined()
        expect(response.body.status).toBeDefined()
        expect(response.body.error).toBeNull()
        expect(response.body.timestamp).toBeDefined()

        externalId = data.id
        sellId = response.body.uuid
      })

      test('returns successful response for agent sell', async () => {
        const data = generatePayload()
        const { success, response, request } = await atolAgent.sell
          .create({
            ...data,
          })
          .catch(error => error)

        // console.log(response)
        // console.log(request.body.receipt.items)

        expect(success).toBe(true)

        expect(response.status).toBe(200)
        expect(response.body.uuid).toBeDefined()
        expect(response.body.status).toBeDefined()
        expect(response.body.error).toBeNull()
        expect(response.body.timestamp).toBeDefined()
      })

      test('returns data about sell by uuid', async () => {
        const result = await atol.report.get(sellId).catch(error => error)
        const {
          success,
          response: { body },
        } = result

        expect(success).toBe(true)

        expect(body.uuid).toEqual(sellId)
        expect(body.external_id).toEqual(externalId)

        expect(body.callback_url).toEqual(atol.callbackUrl)
        expect(body.group_code).toEqual(atol.group)
      })
    })

    describe('refund', () => {
      test('returns validation error', async () => {
        const { success, response } = await atol.sell
          .refund({})
          .catch(error => error)

        expect(success).toBe(false)
        expect(response.status).toBe(400)
        expect(response.body.status).toMatchSnapshot('fail')
        expect(response.body.error.text).toMatchSnapshot()
      })

      test('returns successful response', async () => {
        const data = generatePayload()
        const { success, response } = await atol.sell
          .refund(data)
          .catch(error => error)

        expect(success).toBe(true)

        expect(response.status).toBe(200)
        expect(response.body.uuid).toBeDefined()
        expect(response.body.status).toBeDefined()
        expect(response.body.error).toBeNull()
        expect(response.body.timestamp).toBeDefined()
      })
    })

    describe('correction', () => {
      test('returns validation error', async () => {
        const { success, response } = await atol.sell
          .correction({})
          .catch(error => error)

        expect(success).toBe(false)
        expect(response.status).toBe(400)
        expect(response.body.status).toMatchSnapshot('fail')
        expect(response.body.error.text).toMatchSnapshot()
      })

      test('returns successful response', async () => {
        const data = correction()
        const { success, response } = await atol.sell
          .correction(data)
          .catch(error => error)

        expect(success).toBe(true)

        expect(response.status).toBe(200)
        expect(response.body.uuid).toBeDefined()
        expect(response.body.status).toBeDefined()
        expect(response.body.error).toBeNull()
        expect(response.body.timestamp).toBeDefined()
      })
    })
  },
  30 * 1000,
)
