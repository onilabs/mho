#!/usr/bin/env conductance

@ = require([
  'mho:std',
  {id:'./commandline-parsing', name:'commandline'},
  {id:'mho:services', name:'services'},
  {id:'./docker', name:'docker'}
]);

//----------------------------------------------------------------------
// check that we've got the environment vars we're expecting and store on 'ENV':

var ENV = ['HOST_WD', 'HOST_GID', 'HOST_UID'] .. 
  @transform(function(v) {
    var val;
    if ((val = process.env[v]) === undefined) throw new Error("Missing environment variable #{v}");
    return [v, val];
  }) .. 
  @pairsToObject;

//----------------------------------------------------------------------
// dispatch

var ARGV = @argv();

var COMMAND_SYNTAX = {
  opts: {
    '-q': {}
  },
  commands: {
    'conductance': {
      opts: {
        '-v': {
          arg: { name: 'version', default: 'latest' }
        },
        '-p': {
          arg: { name: 'ports', default: [], parse: x -> x.split(',') }
        },
      },
      commands: {
        'run': {
          exec: conductance_run
        }
      }
    }
  }
}


var [exec, pars] = @commandline.dispatch(COMMAND_SYNTAX, ARGV);
//console.log(exec);
//console.log(pars ..@inspect(5, 5));

if (!pars[0].opts['-q'])
  console.log("mho - the stratified javascript ide");

exec(pars);
process.exit(0);

//----------------------------------------------------------------------
// commands

function conductance_run([{/*mho*/}, 
                          {/*conductance*/ opts: {'-v':conductance_version, 
                                                  '-p':ports}}, 
                          {/*run*/ args:run_args}
                         ]) {

  @services.initGlobalRegistry(@services.ServicesRegistry({
    docker : @services.builtinServices.docker .. @merge({provisioning_data:{}})
  }));

  @services.withService('docker') {
    |docker|

    docker .. @docker.runSubContainer({
      Image: "onilabs/conductance:#{conductance_version}",
      args: run_args,
      ports: ports
    });
  }

}
