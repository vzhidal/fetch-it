import 'isomorphic-fetch';


const DEFAULT_CONFIG = {};


function isFormData(o) {
  return toString.call(o) === '[object FormData]';
}

function isURLSearchParams(o) {
  return toString.call(o) === '[object URLSearchParams]';
}

function isBlob(o) {
  return toString.call(o) === '[object Blob]';
}


class FetchIt {
  constructor(config) {
    this.config = config || DEFAULT_CONFIG;
    this.middlewares = [];
  }

  _createRequest(url, options, method, data) {
    options = Object.assign({}, this.config, options || {});

    let defaultMethod = !data && !options.body ? 'GET' : 'POST';

    options.method = method || options.method || defaultMethod;
    if (!!data) {
      if (typeof data === 'string' || isFormData(data) ||
          isURLSearchParams(data) || isBlob(data)) {
        options.body = data;
      } else {
        try {
          options.body = global.JSON.stringify(data);
        } catch (e) {
          options.body = data;
        }
      }
    }

    return new global.Request(url, options);
  }

  _request(urlOrRequest, ...options) {
    let request;
    if (urlOrRequest instanceof global.Request) {
      request = urlOrRequest;
    } else {
      request = this._createRequest(urlOrRequest, ...options);
    }

    let promise = global.Promise.resolve(request);
    let chain = [global.fetch, undefined];

    for (let middleware of this.middlewares) {
      chain.unshift(middleware.request, middleware.requestError);
      chain.push(middleware.response, middleware.responseError);
    }

    while (!!chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }

  addMiddlewares(middlewares) {
    this.middlewares.push(...middlewares);
  }

  clearMiddlewares() {
    this.middlewares = [];
  }

  fetch(url, options) {
    return this._request(url, options);
  }

  get(url, options) {
    return this._request(url, options, 'GET');
  }

  post(url, data, options) {
    return this._request(url, options, 'POST', data);
  }

  patch(url, data, options) {
    return this._request(url, options, 'PATCH', data);
  }

  put(url, data, options) {
    return this._request(url, options, 'PUT', data);
  }

  delete(url, options) {
    return this._request(url, options, 'DELETE');
  }

  head(url, options) {
    return this._request(url, options, 'HEAD');
  }
}


let jsonMiddleware = {
  response(res) {
    return res.json().catch((e) => {
      return e;
    });
  }
};


class FetchItFactory {
  constructor() {
    this.instance = new FetchIt();
    this.middleware = {
      jsonMiddleware
    };
  }

  create(config) {
    return new FetchIt(config);
  }

  addMiddlewares(middlewares) {
    this.instance.addMiddlewares(middlewares);
  }

  clearMiddlewares() {
    this.instance.clearMiddlewares();
  }

  fetch(...args) {
    return this.instance.fetch(...args);
  }

  get(...args) {
    return this.instance.get(...args);
  }

  post(...args) {
    return this.instance.post(...args);
  }

  patch(...args) {
    return this.instance.patch(...args);
  }

  put(...args) {
    return this.instance.put(...args);
  }

  delete(...args) {
    return this.instance.delete(...args);
  }

  head(...args) {
    return this.instance.head(...args);
  }
}


export default new FetchItFactory();
