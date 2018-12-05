require('dotenv').config()
import Atol from '..'
import moment from 'moment'
import uuid from 'uuid/v4'

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
    email: 'andreystepanov.blog@gmail.com',
    phone: '+380939777959',
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

// const instance = new Atol({})

beforeEach(() => {
  atol = new Atol(options)
})

test('Atol exists', () => {
  expect(Atol).toBeDefined()
})

test('Receives all the options', () => {
  expect(atol).toMatchSnapshot()
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
