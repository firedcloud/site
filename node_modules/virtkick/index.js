let humps = require('humps');
let Promise = require('bluebird').getNewLibraryCopy();
let merge = require('merge');

Promise.longStackTraces(true);

function requireOptions(options, names) {
  names.forEach(name => {
    if(!options[name]) {
      throw new Error(`Options should contain: ${name}`)
    }
  });
}
let apiSymbol = Symbol('api');

class VirtkickMachine {
  constructor(api, data) {
    this[apiSymbol] = api;
    merge(this, data);
  }
  get api() {
    return this[apiSymbol];
  }
  static fromMachineId(api, machineId) {
    let machine = new VirtkickMachine(api, {id: machineId});
    return machine.refresh();
  }
  refresh() {
    return this.api.get(`machines/${this.id}`).get('machine')
      .then(data => merge(this, data));
  }
  destroy() {
    return this.api.delete(`machines/${this.id}`).bind(this.api)
      .then(this.api.pollForFinished);
  }
}
['start', 'pause', 'resume', 'stop', 'forceStop',
'restart', 'forceRestart', 'resetRootPassword']
  .forEach(action => {
    VirtkickMachine.prototype[action] = function() {
      return this.api.post(`machines/${this.id}/${humps.decamelize(action)}`).bind(this.api)
        .then(this.api.pollForFinished).then(() => this.refresh())
    }
  });

class VirtkickApi {
  constructor(options) {
    requireOptions(options, ['apiKey', 'panelUrl']);
    let {apiKey, panelUrl} = options;
    
    this.panelUrl = panelUrl.replace(/\/$/, '');
    this.token = apiKey;
    this.axios = require('axios').create({
      auth: {
        username: apiKey.split(':')[0],
        password: apiKey.split(':')[1]
      },
      headers: {
        'Content-Type': 'application/json'
      },
      transformRequest: [humps.decamelizeKeys, JSON.stringify],
      transformResponse: [JSON.parse, humps.camelizeKeys],
    });
  }
  
  pollForFinished(pollData, progressCb = () => {}) {
    let progressId = pollData.progressId || pollData;
    return this.get(`progress/${progressId}`, null, {fullResponse: true})
      .then(response => {
        let data = response.data;
        if(data.error) {
          throw new ApiError({
            response: response,
            config: response.config
          }, data.error);
        }
        progressCb(data.data);
        if(!data.finished) {
          return Promise.delay(100)
            .then(() => this.pollForFinished(progressId, progressCb));
        }
        return data.data;
      });
  }
  
  user() {
    return this.get('user').get('user');
  }
  
  images() {
    return this.get('images').get('images');
  }
  
  plans() {
    return this.get('plans').get('plans');
  }
  
  machine(id) {
    return this.get(`machines/${id}`).get('machine')
      .then(machine => new VirtkickMachine(this, machine));
  }
  
  subscriptions(options = {}) {
    let {unused = 'false'} = options;
    return this.get(`subscriptions?unused=${unused}`).get('subscriptions');
  }
  
  machines() {
    return this.get('machines').get('machines')
      .map(machine => new VirtkickMachine(this, machine));
  }
  
  createMachine(options, progressCb) {
    requireOptions(options, ['hostname', 'imageId', 'planId']);
    let {hostname, imageId, planId, subscriptionId} = options;
    
    return this.post('machines', {
      machine: {
        hostname: hostname,
        imageId: imageId,
        planId: planId,
        subscriptionId: subscriptionId
      }
    }).then(data => this.pollForFinished(data.machine.progressId, progressCb))
      .then(data => {
        return VirtkickMachine.fromMachineId(this, data.machineId);
      });
  }
}

class ApiError extends Error {
  constructor(err, message) {
    message = `${err.response.status} ${err.response.statusText} : ${err.config.url} : ${message}`;
    super(message);
    Error.captureStackTrace( this, this.constructor )
    this.originalError = err;
    this.message = message;
    this.name = 'ApiError';
  }
}

['post', 'get', 'put', 'delete'].forEach(httpMethod => {
  VirtkickApi.prototype[httpMethod] = function(endpoint, data, options = {}) {
    let {fullResponse} = options;
    return Promise.try(() => {
      return this.axios[httpMethod](`${this.panelUrl}/api/${endpoint}`, data);
    }).then(response => {
      if(fullResponse) return response;
      return response.data;
    }).catch(err => err.response, err => {
      let data = JSON.parse(err.response.data);
      if(data.error) {
        throw new ApiError(err, data.error);
      }
      if(data.errors) {
        throw new ApiError(err, data.errors.join(', '));
      }
      throw err;
    });
  }
});

module.exports = VirtkickApi;
module.exports.ApiError = ApiError;
