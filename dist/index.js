"use strict";

var _axios = _interopRequireDefault(require("axios"));

var _underscore = _interopRequireDefault(require("underscore"));

var _isUrl = _interopRequireDefault(require("is-url"));

var _moment = _interopRequireDefault(require("moment"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const http = _axios.default.create();

http.interceptors.response.use(res => {
  const data = res.data;

  if (!data) {
    return Promise.reject(res);
  }

  if ('token' in data && (data.code >= 2 || data.token === '') || data.status === 'fail' || data.error && data.error.code) {
    return Promise.reject(res);
  }

  return res;
}, (_ref) => {
  let response = _ref.response,
      error = _objectWithoutProperties(_ref, ["response"]);

  if (response) {
    error.statusText = response.statusText;
    error.status = response.status;
    error.headers = response.headers;
    error.data = response.data;
  }

  return Promise.reject(error);
});
module.exports = class Atol {
  constructor(options = {}) {
    const optns = _underscore.default.defaults(options, {
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
      supplier: null
    });

    optns.agent = _underscore.default.defaults(optns.agent || {}, {
      type: process.env.ATOL_AGENT_TYPE,
      phones: process.env.ATOL_AGENT_PHONES
    });
    const agentTypes = ['bank_paying_agent', 'bank_paying_subagent', 'paying_agent', 'paying_subagent', 'attorney', 'comission_agent', 'another'];
    const vats = {
      none: 'none',
      10: 'vat10',
      18: 'vat18',
      20: 'vat20',
      '10/110': 'vat110',
      '18/118': 'vat118'
    };
    const snoList = ['osn', 'usn_income', 'usn_income_outcome', 'envd', 'esn', 'patent'];

    if (!optns.login) {
      console.warn('WARN: Login is undefined, add your login');
    }

    if (!optns.password) {
      console.warn('WARN: Password is undefined, add your password');
    }

    if (!optns.group) {
      console.warn('WARN: Group is undefined, add your group');
    }

    if (!optns.inn) {
      console.warn('WARN: Inn is undefined, add your inn');
    }

    if (!optns.email) {
      console.warn('WARN: email is undefined, add your email');
    }

    if (!optns.url) {
      console.warn('WARN: Url is undefined, add your url');
    }

    if (!(optns.vat in vats)) {
      console.warn('WARN: Vat should be one of: ', Object.keys(vats).join());
    }

    const validAgentType = agentTypes.includes(optns.agent.type);

    if (optns.agent.type && validAgentType === false) {
      console.warn('WARN: Agent type should be one of: ', agentTypes.join());
    }

    this.login = optns.login;
    this.password = optns.password;
    this.group = optns.group;
    this.company = {
      email: optns.email,
      inn: optns.inn,
      payment_address: optns.url
    };
    this.agent = validAgentType ? Atol.prepareAgent(optns.agent) : null;
    this._originalAgent = optns.agent;
    this.supplier = Atol.prepareSupplier(optns.supplier);
    this._originalSupplier = optns.supplier;

    if (optns.sno) {
      if (snoList.includes(optns.sno)) {
        this.company.sno = optns.sno;
      } else {
        console.warn('WARN: SNO should be empty or one of: ', snoList.join());
      }
    }

    this.vatType = vats[optns.vat];
    this.apiToken = null;
    this.apiVersion = 'v4';
    this.apiUrl = `https://${!!optns.livemode ? '' : 'test'}online.atol.ru/possystem/${this.apiVersion}`;
    this.userAgent = 'Atol-Online-Node/0.1';
    this.paymentTypes = {
      online: 1,
      advance: 2,
      credit: 3,
      other: 4,
      custom: 5,
      custom_2: 6,
      custom_3: 7,
      custom_4: 8,
      custom_5: 9
    };

    if (optns.callback_url) {
      this.callbackUrl = null; // const pattern = /^http(s?):\/\/[0-9a-zA-Zа-яА-Я]([-.\w]*[0-9a-zA-Zа-яА-Я])*(:(0-9)*)*(\/?)([a-zA-Z0-9а-яА-Я-.?,'/+&=%$#_]*)?$/

      if ((0, _isUrl.default)(optns.callback_url)) {
        this.callbackUrl = optns.callback_url;
      } else {
        console.log('WARN: Callback url show be valid');
      }
    }

    this.sell = {
      create: this.sellCreate.bind(this),
      refund: this.sellRefund.bind(this),
      correction: this.sellCorrection.bind(this)
    };
    this.report = {
      get: this.getReport.bind(this)
    };
  }

  static formatResponse(res) {
    const _res$request = res.request,
          reqHeaders = _res$request._headers,
          request = _objectWithoutProperties(_res$request, ["_headers"]),
          _res$config = res.config,
          sentAt = _res$config.sentAt,
          url = _res$config.url,
          params = _res$config.params,
          data = _res$config.data,
          status = res.status,
          response = _objectWithoutProperties(res, ["request", "config", "status"]);

    let requestBody;

    try {
      requestBody = JSON.parse(data || null);
    } catch (err) {
      requestBody = null;
    }

    const formattedResponse = {
      success: status === 200,
      request: {
        headers: request ? _underscore.default.omit(reqHeaders, ['user-agent']) : null,
        url,
        params,
        body: requestBody
      },
      response: {
        status,
        status_text: response.statusText,
        smoke_screen: !status,
        headers: response.headers,
        body: response.data,
        time: `${(0, _moment.default)().diff(sentAt)} ms`
      },
      created_at: sentAt.format()
    };
    return formattedResponse;
  }

  call(method = 'get', endpoint = '', {
    data = null,
    params = null
  } = {}) {
    var _this = this;

    return _asyncToGenerator(function* () {
      const token = yield _this.authenticate();
      const options = {
        method,
        url: `${_this.apiUrl}/${_this.group}/${endpoint}`,
        data,
        params,
        headers: {
          'User-Agent': _this.userAgent,
          Token: token
        },
        sentAt: (0, _moment.default)()
      };
      return http.request(options).then(Atol.formatResponse).catch(Atol.formatResponse);
    })();
  }

  authenticate() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      if (_this2.apiToken) {// return this.apiToken
      }

      yield http.post(`${_this2.apiUrl}/getToken`, {
        login: _this2.login,
        pass: _this2.password
      }, {
        headers: {
          'User-Agent': _this2.userAgent
        }
      }).then(res => {
        _this2.apiToken = res.data.token;
        return res.data.token;
      }).catch(error => Promise.reject(error.data));
      return _this2.apiToken;
    })();
  }

  static timestamp(input = null, inputFormat = null) {
    const date = (0, _moment.default)(input, inputFormat);
    return (date.isValid() ? date : (0, _moment.default)()).format('DD.MM.YYYY HH:mm:ss');
  }

  static formatPhones(phones) {
    if (typeof phones === 'string') {
      return phones.replace(/[ ]/g, '').split(',');
    }

    return phones;
  }

  static prepareAgent(_ref2 = {}) {
    let type = _ref2.type,
        phones = _ref2.phones,
        rest = _objectWithoutProperties(_ref2, ["type", "phones"]);

    const formattedPhones = Atol.formatPhones(phones);
    const agent = {
      type
    };
    const advancedTypes = ['paying_agent', 'receive_payments_operator', 'money_transfer_operator'];
    const allowedFields = [];

    if (type === 'paying_agent') {
      allowedFields.push('operation');
    } else if (type === 'money_transfer_operator') {
      allowedFields.push('name', 'address', 'inn');
    }

    if (advancedTypes.includes(type)) {
      agent[type] = _objectSpread({}, _underscore.default.pick(rest, allowedFields), {
        phones: formattedPhones
      });
    }

    return agent;
  }

  static prepareSupplier(data) {
    if (!data) {
      return null;
    }

    const supplier = _objectSpread({}, data);

    supplier.phones = Atol.formatPhones(supplier.phones || null);
    return _underscore.default.pick(supplier, ['phones', 'name', 'inn']);
  }

  preparePurchaseOrRefund({
    id,
    timestamp,
    timestamp_format: timestampFormat,
    customer: client,
    callback_url: callbackUrl,
    items: list = [],
    payment_type: paymentType = 'online'
  } = {}) {
    const items = this.prepareItems(list);
    const paymentTotal = items.reduce((total, current) => parseFloat((total + current.sum).toFixed(2)), 0);
    const data = {
      external_id: id,
      receipt: {
        client,
        company: this.company,
        items,
        payments: [{
          type: this.paymentTypes[paymentType],
          sum: paymentTotal
        }],
        total: paymentTotal
      },
      service: {
        callback_url: callbackUrl || this.callbackUrl
      },
      timestamp: Atol.timestamp(timestamp, timestampFormat)
    };
    return data;
  }

  prepareItems(items = []) {
    return items.map(({
      type,
      payment,
      quantity = 1,
      unit_label: unitLabel,
      name,
      price: itemPrice = 0,
      agent = null,
      supplier = null
    }) => {
      const price = parseFloat(itemPrice.toFixed(2));
      const sum = parseFloat((price * quantity).toFixed(2));
      const vatType = this.vatType;
      const agentInfo = this.agent && agent !== false ? Atol.prepareAgent(_underscore.default.defaults(agent, this._originalAgent)) : null;
      const supplierInfo = agentInfo ? Atol.prepareSupplier(_underscore.default.defaults(supplier, this._originalSupplier)) : null;
      const item = {
        name,
        price,
        quantity,
        sum,
        measurement_unit: unitLabel,
        payment_method: payment || 'full_prepayment',
        // full_payment
        payment_object: type || 'commodity',
        vat: {
          type: vatType,
          sum: Atol.vat(sum, vatType)
        },
        agent_info: agentInfo,
        supplier_info: supplierInfo
      };

      if (!item.agent_info) {
        delete item.agent_info;
        delete item.supplier_info;
      }

      return item;
    });
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
    callback_url: callbackUrl
  } = {}) {
    const vatType = vat || this.vatType;
    const timestampDate = (0, _moment.default)(timestamp || undefined, timestampFormat);
    return {
      external_id: id,
      correction: {
        company: this.company,
        correction_info: {
          type: instruction ? 'instruction' : 'self',
          base_date: timestampDate.format('DD.MM.YYYY'),
          base_number: number,
          base_name: description
        },
        payments: [{
          type: this.paymentTypes[paymentType],
          sum: amount
        }],
        vats: [{
          type: vatType,
          sum: Atol.vat(amount, vatType)
        }]
      },
      service: {
        callback_url: callbackUrl || this.callbackUrl
      },
      timestamp: Atol.timestamp(timestampDate, timestampFormat)
    };
  }

  static vat(amount = 0, vatType) {
    const deviders = {
      vat10: 0.1,
      vat18: 0.18,
      vat20: 0.2
    };

    if (vatType === 'none' || !(vatType in deviders)) {
      return 0;
    }

    return parseFloat((amount * deviders[vatType]).toFixed(2));
  }

  sellCreate(payload) {
    const data = this.preparePurchaseOrRefund(payload);
    return this.call('post', 'sell', {
      data
    });
  }

  sellRefund(payload) {
    const data = this.preparePurchaseOrRefund(payload);
    return this.call('post', 'sell_refund', {
      data
    });
  }

  sellCorrection(payload) {
    const data = this.prepareCorrection(payload);
    return this.call('post', 'sell_correction', {
      data
    });
  }

  getReport(id) {
    return this.call('get', `report/${id}`);
  }

  static error(message) {
    return Promise.reject(new Error(message));
  }

};
