@ = require([
  'mho:std'
]);

function peelOpts(argv, opts) {
  var rv = {};
  if (opts) {
    while (argv.length) {
      var argname = argv[0];
      var opt = opts[argname];
      if (!opt) break;
      argv.shift();
      var val;
      if (opt.arg) {
        if (!argv.length) exitWithHelp("Missing argument for option #{argname}");
        val = argv.shift();
      }
      else
        val = true;
      rv[argname] = val;
    }
    // fill in defaults:
    opts .. @propertyPairs .. @each {
      |[propname,descriptor]|
      if (descriptor.arg && 
          descriptor.arg['default'] !== undefined && 
          rv[propname] === undefined
         )
        rv[propname] = descriptor.arg['default'];
    }   
  }
  return rv;
}

function dispatch(syntax, argv) {
  var exec;
  var pars = {};
  pars.opts = peelOpts(argv, syntax.opts);
  if (argv.length && syntax.commands && syntax.commands[argv[0]]) {
    var command_name = argv.shift();
    [exec, subpars] = dispatch(syntax.commands[command_name], argv);
    subpars[0].command = command_name;
    return [exec, [pars].concat(subpars)];
  }
  else {
    if (!syntax.exec) {
      if (argv.length)
        exitWithHelp("Unknown command '#{argv[0]}'");
      else
        exitWithHelp("Incomplete commandline");
    }
    pars.args = argv;
    return [syntax.exec, [pars]];
  }
}
exports.dispatch = dispatch;

function exitWithHelp(err) {
  err ? console.log(err);
  process.exit(err ? 1 : 0);
}

