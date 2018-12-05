## atol-online

Node-клиент для [Атол.Онлайн](https://online.atol.ru)

## Установка

Используя `npm`:

    npm install atol-online

Используя `yarn`:

    yarn add atol-online

## Примеры

Инициализация клиента:

    const Atol = request('atol-online')

    const atol = new Atol({
      email: 'support@domain.ru',
    url: 'https://domain.ru',
    callback_url: 'https://domain.ru/callback',
    vat: 10
    })

Отправляем запрос для чека «Прихода»:

    atol.sell
      .create({
      id: 'order_id',
      customer: {
         email: 'andreystepanov.blog@gmail.com',
         phone: '+380939777959',
      },
      items: [
          {
            type: 'service',
            name: 'Название товара 1',
            price: 100.0,
            quantity: 2,
            unit_label: 'шт.'
          },
          {
            type: 'service',
            name: 'Название товара 2',
            price: 50.0,
            unit_label: 'шт.'
          },
      ],
      })
      .then(data => {
        console.log(data)
      })
      .catch(data => {
        console.log(data)
      })

Отправляем запрос для чека «Возврат прихода»:

    atol.sell
      .refund({
      id: 'order_id',
      customer: {
         email: 'andreystepanov.blog@gmail.com',
         phone: '+380939777959',
      },
      items: [
          {
            type: 'service',
            name: 'Название товара 1',
            price: 100.0,
            quantity: 2,
            unit_label: 'шт.'
          },
          {
            type: 'service',
            name: 'Название товара 2',
            price: 50.0,
            unit_label: 'шт.'
          },
      ],
      })
      .then(data => {
        console.log(data)
      })
      .catch(data => {
        console.log(data)
      })

Отправляем запрос для чека «Коррекция прихода»:

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

Получаем данные о статусе:

    atol.report
      .get('4475d6d8d-844d-4d05-aa8b-e3dbdf3defd5')
      .then(data => {
        console.log(data)
      })
      .catch(data => {
        console.log(data)
      })

Можно использовать `async/await` (для всех методов):

    async function purchase( payload ) {
      try {
        const data = await atol.sell.create( payload )
        console.log(data)
      } catch (error) {
        console.error(error)
      }
    }

## Конфигурация

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
        // 18
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

      // Возможные варианты:
          // bank_paying_agent
          // bank_paying_subagent
          // paying_agent
          // paying_subagent
          // attorney
          // comission_agent
          // another
      agent_type: '',

      // Если указать true, то данные будут
      // отправляться в тестовую среду Атол.Онлайн.
      // Используется лишь для написания тестов
      livemode: false,
    })

## process.env

Все конфигурации так же могут (и должны) быть указаны в файле `.env` или передаваться динамически. Ниже приведены названия переменных:

    ATOL_VAT=
    ATOL_AGENT_TYPE=
    ATOL_COMPANY_INN=
    ATOL_COMPANY_SNO=
    ATOL_COMPANY_URL=
    ATOL_COMPANY_EMAIL=
    ATOL_GROUP=
    ATOL_LOGIN=
    ATOL_PASSWORD=
