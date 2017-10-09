#!/usr/bin/env conductance

@ = require([
  'mho:std',
  {id:'./commandline-parsing', name:'commandline'}
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
        }
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
//console.log(pars ..@inspect);

if (!pars[0].opts['-q'])
  console.log("mho - the stratified javascript ide");

exec(pars);
process.exit(0);

//----------------------------------------------------------------------
// commands

function conductance_run([{/*mho*/}, 
                          {/*conductance*/ opts: {'-v':conductance_version}}, 
                          {/*run*/ args:run_args}
                         ]) {
  console.log(conductance_version);
  console.log(run_args);
}
