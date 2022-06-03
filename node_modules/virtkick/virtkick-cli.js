#!/usr/bin/env node
const VirtkickApi = require('./');
const Promise = require('bluebird');
Promise.longStackTraces();
const ApiError = VirtkickApi.ApiError;
const fs = Promise.promisifyAll(require('fs'));
const pathJoin = require('path').join;
const merge = require('merge');

const env = process.env;

class CliError extends Error {
  constructor(message) {
    super(message);
    Error.captureStackTrace( this, this.constructor )
    this.message = message;
    this.name = 'CliError';
  }
}


let virtkick;

let commands = {};
let args = {};

function registerCommand(command, options) {
  commands[command] = options;
}

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  completer(line,  cb) {
    return Promise.try(() => {
      let [command, ...args] = line.split(/\s+/)
      if(args.length) {
        let paramInfo = commands[command].params && commands[command].params[args.length - 1];
        if(paramInfo && paramInfo.completer) {
          let arg = args[args.length - 1];
          return Promise.resolve(paramInfo.completer(arg, command)).then(result => {
            let {hits, completions} = result;
            line = [command, ...args].join(' ');
            args.pop();
            return [hits.length ? hits : completions, arg];
          });
        }
      }
      const completions = Object.keys(commands);
      const hits = completions.filter((c) => { return c.indexOf(command) == 0 })
      // show all completions if none found
      return [hits.length ? hits : completions, command]
    }).nodeify(cb)
  }
});


readline.emitKeypressEvents(process.stdin);
if(process.stdin.isTTY)
  process.stdin.setRawMode(true);

rl.setPrompt('> ')

function question(ask) {
  return new Promise((resolve, reject) => {
    rl.question(ask, resolve);
  }).tap(() => {
    rl.history = rl.history.slice(1);
    rl.pause();
  });
}

function questionBool(ask) {
  return question(`${ask} (Y/n): `).then(answer => {
    answer = answer.toLowerCase();
    if(answer !== 'y' && answer !== 'n') {
      return questionBool(ask);
    }
    return answer === 'y';
  });
}

class Config {
  constructor(data) {
    this.data = data;
  }
  
  get(key) {
    return this.data[key];
  }
  
  set(key, value) {
    this.data[key] = value;
  }
  
  get isEmpty() {
    return Object.keys(this.data).length === 0;
  }
  
  static get configPath() {
    return pathJoin(require('osenv').home(), '.virtkick');
  }

  save() {
    return Config.save(this.data);
  }
  
  static save(data) {
    return fs.writeFileAsync(this.configPath, JSON.stringify(data));
  }
  
  static load() {
    return fs.readFileAsync(this.configPath)
      .then(JSON.parse)
      .catch({code: 'ENOENT'}, () => ({}))
      .then(data => new Config(data));
  }
};

let config; // initialized later
// TODO: create CliController and move it there

function getApiKey() {
  return Promise.try(() => config.get('apiKey') || env.API_KEY || question('Enter API Key (or set env var API_KEY): '));
}

function getPanelUrl() {
  return Promise.try(() => config.get('panelUrl') || env.PANEL_URL || question('Enter panel URL (or set env var PANEL_URL): '));
}

function initializeApi() {
  return Config.load().then(_config => {
    config = _config;
    return getApiKey().then(apiKey => {
      return getPanelUrl().then(panelUrl => {
        virtkick = new VirtkickApi({
          apiKey: apiKey,
          panelUrl: panelUrl
        });
        return virtkick.user().tap(() => {
          if(!config.get('apiKey') || !config.get('panelUrl')) {
            return Promise.resolve(env.SAVE_KEYS || questionBool(`Wanna save those keys? (config will be saved to ${Config.configPath})`)).then(saveKeys => {
              if(!saveKeys) {
                return;
              }
              config.set('apiKey', apiKey);
              config.set('panelUrl', panelUrl);
              return config.save().then(() => {
                console.log(`Configuration saved to ${Config.configPath}`);
              });
            });
          }
        });
      })
    });
  });
}

class TablePrinter {
  constructor(...lengths) {
    this.lengths = lengths;
  }
  pad(str, len) {
    str = ' ' + str;
    while(str.length < len) str += ' ';
    return str;
  }
  print(...entries) {
    let str = entries.map((entry, i) => {
      return this.pad(entry, this.lengths[i]);
    }).join('|');
    console.log(str);
  }
};

function askForImage(preselectedImage) {
  return virtkick.images().then(images => {
    let imageMap = {};
    let imageList = images.map(image => {
      imageMap[image.id] = image;
      return `${image.id}) ${image.distribution.name} ${image.version} (${image.imageType})`;
    }).join('\n');
    
    return Promise.resolve(preselectedImage || question(`${imageList}\nChoose image: `))
      .then(imageId => {
        if(!imageMap[imageId]) {
          throw new CliError(`Unknown image: ${imageId}`);
        }
        return imageMap[imageId];
      });
  });
}

function askForPlan(preselectedPlan) {
  return Promise.all([
    virtkick.plans(),
    virtkick.subscriptions({unused: true})])
    .spread((plans, subscriptions) => {
    let planMap = {};
  
    plans.forEach(plan => {
      planMap[plan.id] = plan;
    });

    subscriptions.forEach(subscription => {
      if(subscription.plan.id) {
        planMap[subscription.plan.id].subscription = subscription;
      }
    });
        
    let planList = plans.map(plan => {
      planMap[plan.id] = plan;
      let {cpu, memory, storage, storageType} = plan.params;
      storage /= 1024 * 1024 * 1024;
      let planName = plan.name || `CPU ${cpu} / RAM ${memory}GB / ${storageType} ${storage}GB`
      let price = `$${plan.price.value/100}`;
      if(plan.subscription) {
        price = 'Already paid';
      }
      return `${plan.id}) ${planName} - ${price}`;
    }).join('\n');
      
    
    return Promise.resolve(preselectedPlan || question(`${planList}\nChoose plan: `)).then(planId => {
      if(!planMap[planId]) {
        throw new CliError(`Unknown plan: ${planId}`);
      }
      return planMap[planId];
    });
  });
}

let machineHostnameParam = {
  completer(hostname) {
    return virtkick.machines().map(machine => machine.hostname).then(completions => {
      const hits = completions.filter((c) => { return c.indexOf(hostname) == 0 })
      return {
        hits: hits,
        completions: completions
      };
    });
  },
  name: 'hostname'
};

function matchMachine(hostname) {
  if(hostname.match(/^\d+$/)) {
    machinePromise = virtkick.machine(hostname);
  } else {
    machinePromise = virtkick.machines().then(machines => {
      let machineMap = {};
      let matches =  machines.filter(machine => {
        machineMap[machine.hostname] = machine;
        return machine.hostname.match(new RegExp(hostname));
      });
      if(matches.length > 1 && !machineMap[hostname]) {
        console.log('Multiple matches: ', matches.map(machine => machine.hostname).join(', '));
        return null;
      }
      if(matches.length) {
        return machineMap[hostname] || matches[0];
      }
      throw new CliError(`Cannot find machine matching your query: ${hostname}`);
    });
  }
  return machinePromise;
}


registerCommand('show', {
  handler(num) {
    let printer = new TablePrinter(16, 50);
    let machinePromise = matchMachine(num);
    return machinePromise.then(machine => {
      if(machine == null) return;
      
      let fields = {
        id: true,
        hostname: true,
        status: true,
        ip: () => machine.ips[0].address,
        rootPassword: true,
        cpuUsage: () => machine.cpuUsage.toFixed(2),
        cpus: true,
        storage: () => `${machine.storage[0].capacity / 1024 / 1024} GB`,
        memory: () => `${machine.memory / 1024 / 1024} GB`
      }
      for(let field of Object.keys(fields)) {
        let value = fields[field] === true ? machine[field] : fields[field]();
        if(typeof value !== 'undefined')
          printer.print(...[field, value]);
      }
    });
  },
  params: [machineHostnameParam]
});

['start', 'pause', 'resume', 'stop', 'forceStop',
'restart', 'forceRestart', 'resetRootPassword', 'destroy'].forEach(command => {
  registerCommand(command, {
    handler(hostname) {
      let machinePromise = matchMachine(hostname);
      return machinePromise.then(machine => {
        if(machine == null) return;
        return machine[command]().then(() => {
          console.log('Action successful');
        });
      });
    },
    params: [machineHostnameParam]
  });
});

registerCommand('destroyAll', {
  handler(arg) {
    if(arg !== 'really') {
      throw new CliError(`Write 'destroyAll really'`);
    }
    return Promise.all(virtkick.machines()).map(machine => {
      return machine.destroy();
    }).then(() => {
      console.log('All machines destroyed');
    });
  }
});

registerCommand('list', {
  handler() {
    return virtkick.machines().then(machines => {
      if(!machines.length) {
        return console.log(`You don't have any machines yet, why don't you create one?`);
      }
      let printer = new TablePrinter(6, 20, 16, 10);
      printer.print('id', 'hostname', 'ip', 'status');
      machines.map(machine => {
        printer.print(machine.id, machine.hostname, machine.ips[0].address, machine.status);
      });
    });
  }
});

registerCommand('help', {
  handler() {
    return console.log(`List of commands: ${Object.keys(commands).join(' ')}`);
  }
});

registerCommand('create', {
  handler(preselectedImage, preselectedPlan, preenteredHostname) {
    return askForImage(preselectedImage).then(image => {
      return askForPlan(preselectedPlan).then(plan => {
        return Promise.resolve(preenteredHostname || question('Enter hostname: ')).then(hostname => {
          process.stdout.write('Creating your machine...');
          
          let t1 = new Date().getTime();;
          return virtkick.createMachine({
            hostname: hostname,
            imageId: image.id,
            planId: plan.id,
            subscriptionId: plan.subscription ? plan.subscription.id : undefined
          }, () => process.stdout.write('.')).then(() => {
            console.log(`OK (in ${(new Date().getTime() - t1)/1000}s)`);
          });
        });
      })
    })
  }
});

function processLine(line) {
  return Promise.try(() => {
    rl.pause();
    let [command, ...args] = line.trim().split(/\s+/);
    let commandInfo = commands[command];
    if(commandInfo) {
      if(commandInfo.params) {
        if(args.length < commandInfo.params.length) {
          throw new CliError(`Usage: ${command} ${commandInfo.params.map((param, i) => `<${param.name || `arg${i+1}`}>`).join(' ')}`);
        }
      }
      
      return commandInfo.handler(...args);
    }
    console.log(`Unknown command: ${line} `);
    return commands['help'].handler();
  });
}

function setupPrompt() {
  rl.prompt('');
  rl.on('line', (line) => {
    return processLine(line)
    .catch(ApiError, err => console.error('ApiError:', err.message))
    .catch(CliError, err => console.error('Error:', err.message))
    .catch(err => console.error(err.stack))
    .finally(() => rl.prompt());
  }).on('close', () => {
    console.log("\nkthx, Keep on virtkickin'");
    process.exit(0);
  });
}

initializeApi().then(() => {
  virtkick.user().then(user => {
    console.log(`Howdy ${user.email}! Welcome to: ${virtkick.panelUrl}`);
    
    if(process.argv.length > 2) {
      let [arg1, arg2, ...args] = process.argv;
      processLine(args.join(' ')).then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
      });
    } else {
      setupPrompt();
    }
  });
});
