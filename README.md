## atol-online

Node-клиент для [Атол.Онлайн](https://online.atol.ru)

## Установка

Используя `npm`:

```
npm install atol-online
```

Используя `yarn`:

```
yarn add atol-online
```

## Примеры

Инициализация клиента:

```javascript
const Atol = require('atol-online')

const atol = new Atol({
  email: 'support@domain.ru',
  url: 'https://domain.ru',
  callback_url: 'https://domain.ru/callback',
  vat: 10,
})
```

Отправляем запрос для чека «Прихода»:

```javascript
atol.sell
  .create({
    id: 'order_id',
    customer: {
      email: 'example@domain.ru',
      phone: '+79627772211',
    },
    items: [
      {
        type: 'service',
        name: 'Название товара 1',
        price: 100.0,
        quantity: 2,
        unit_label: 'шт.',
      },
      {
        type: 'service',
        name: 'Название товара 2',
        price: 50.0,
        unit_label: 'шт.',
      },
    ],
  })
  .then(data => {
    console.log(data)
  })
  .catch(data => {
    console.log(data)
  })
```

Передаем данные об агенте:

```javascript
const atol = new Atol({
  ...,
  agent: {
    type: 'paying_agent',
    operation: 'Комиссия за использование сервиса',
    phones: ['+79627772299']
  },
  supplier: {
    name: 'ООО «Ромашка»',
    phones: ['+79627772233', '+79627772200'],
    inn: '424242424242',
  }
})

atol.sell.create({
  id: 'order_id',
  customer: {
    email: 'example@domain.ru',
    phone: '+79627772211',
  },
  items: [
    {
      type: 'service',
      name: 'Название товара 1',
      price: 100.0,
      quantity: 2,
      unit_label: 'шт.',
      agent: false // не передаем данные агента для этого товара
    },
    {
      type: 'service',
      name: 'Название товара 2',
      price: 50.0,
      unit_label: 'шт.',
      agent: {
        // передаем другие данные агента
        // для этого товара
        ...
      },
      supplier: {
        // передаем другие данные поставщика
        // для этого товара
        ...
      }
    },
  ]
}).
```

Отправляем запрос для чека «Возврат прихода»:

```javascript
atol.sell
  .refund({
    id: 'order_id',
    customer: {
      email: 'example@domain.ru',
      phone: '+79627772211',
    },
    items: [
      {
        type: 'service',
        name: 'Название товара 1',
        price: 100.0,
        quantity: 2,
        unit_label: 'шт.',
      },
      {
        type: 'service',
        name: 'Название товара 2',
        price: 50.0,
        unit_label: 'шт.',
      },
    ],
  })
  .then(data => {
    console.log(data)
  })
  .catch(data => {
    console.log(data)
  })
```

Отправляем запрос для чека «Коррекция прихода»:

```javascript
atol.sell
  .correction({
    id: 'correction_id', // уникальный ID
    amount: 100.0,
    number: '123456', // номер коррекции
    description: 'Описание коррекции',
    instruction: true, // по-умолчанию false
    payment_type: 'advance',
  })
  .then(data => {
    console.log(data)
  })
  .catch(data => {
    console.log(data)
  })
```

Получаем данные о статусе:

```javascript
atol.report
  .get('4475d6d8d-844d-4d05-aa8b-e3dbdf3defd5')
  .then(data => {
    console.log(data)
  })
  .catch(data => {
    console.log(data)
  })
```

Можно использовать `async/await` (для всех методов):

```javascript
async function purchase(payload) {
  try {
    const data = await atol.sell.create(payload)
    console.log(data)
  } catch (error) {
    console.error(error)
  }
}
```

## Конфигурация

Доступы к тестовой среде можно найти ниже [в описании](#processenv).

```javascript
const atol = new Atol({
  // Логин для авторизации
  login: 'user',

  // Пароль для авторизации
  password: 'pass',

  // Идентификатор группы ККТ
  group: 'group-code',

  // ИНН организации.
  // Используется для предотвращения ошибочных регистраций чеков на ККТ
  inn: '12341234',

  // Возможные варианты:
  // `osn`
  // `usn_income`
  // `usn_income_outcome`
  // `envd`
  // `esn`
  // `patent`
  sno: null,

  // Возможные варианты:
  // 10
  // 18 (временно присутствует)
  // 20
  // `10/110`
  // `18/118`
  // по-молчанию `none`
  vat: 'none',

  // Электронная почта отправителя чека
  email: 'support@domain.ru',

  // Адрес сайта на котором была сделана покупка
  url: 'https://domain.ru',

  // адрес на который будут отправляться уведомления
  // об изменении статуса
  callback_url: 'https://domain.ru/callback',

  // Передаем данные агента
  agent: {
    // Тип агента. Возможные варианты:
    // bank_paying_agent
    // bank_paying_subagent
    // paying_agent
    // paying_subagent
    // attorney
    // comission_agent
    // another
    type: null,

    // Массив или строка с `,` в качестве разделителя, например:
    // [ '+79627772211', '+79627772233' ]
    // `+79627772211,+79627772233`
    phones: [],

    //...
    // другие параметры из документации Атола
  },

  // Передаем данные поставщика
  supplier: {
    // Название компании поставшика
    name: 'ООО «Ромашка»',

    // Телефоны поставщика
    phones: '+79627772211, +79627772200',

    // ИНН поставщика
    inn: '454545454545',
  },

  // Если указать true, то данные будут
  // отправляться в тестовую среду Атол.Онлайн.
  // Используется лишь для написания тестов
  livemode: false,
})
```

## process.env

Все конфигурации так же могут (и должны) быть указаны в файле `.env` или передаваться динамически. Ниже приведены названия переменных и данные тестовой среды Атола (ребята из тех. поддержки любезно поделились ими)

```
ATOL_VAT=
ATOL_AGENT_TYPE=
ATOL_AGENT_PHONES=
ATOL_COMPANY_SNO=
ATOL_LOGIN=v4-online-atol-ru
ATOL_PASSWORD=iGFFuihss
ATOL_GROUP=v4-online-atol-ru_4179
ATOL_COMPANY_URL=https://v4.online.atol.ru
ATOL_COMPANY_EMAIL=email@atol.ru
ATOL_COMPANY_INN=5544332219
```
