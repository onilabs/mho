@ = require([
  'mho:std'
]);

function peelOpts(argv, opts, ignoreErrors) {
  var rv = {};
  if (opts) {
    while (argv.length) {
      var argname = argv[0];
      var opt = opts[argname];
      if (!opt) break;
      argv.shift();
      var val;
      if (opt.arg) {
        if (!argv.length) {
          if (ignoreErrors) return rv;
          console.log("Missing argument for option #{argname}.");
          process.exit(1);
        }
        val = argv.shift();
        if (opt.arg.parse)
          val = opt.arg.parse(val);
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

function formatHelp(syntax, command_path, argv) {
  var rv = [];
  // locate syntax @ command given by argv:
  while (argv.length) {
    peelOpts(argv, syntax.opts, true); // ignore opts
    if (!syntax.commands || !syntax.commands[argv[0]])
      break;
    command_path.push(argv[0]);
    syntax = syntax.commands[argv.shift()];
  }

  if (argv.length)
    rv.push("Unknown command '#{argv[0]}'\n");

  var command_args = [];
  var opts_help = [];
  if (syntax.opts) {
    @propertyPairs(syntax.opts) .. @each { 
      |[name,descr]|
      command_args.push("[#{name}#{descr.arg?" #{descr.arg.name||'VAL'}":''}]");
      if (descr.help_txt) {
        opts_help.push("    #{name}#{descr.arg?" #{descr.arg.name||'VAL'}":''} : #{descr.help_txt}");
      }
    }
  }

  if (syntax.arg_txt)
    command_args.push(syntax.arg_txt);
  else if (syntax.commands)
    command_args.push('COMMAND');

  rv.push("Usage: #{command_path.join(' ')} #{command_args.join(' ')}");

  if (syntax.help_txt)
    rv = rv.concat('', syntax.help_txt);

  if (opts_help.length)
    rv = rv.concat('', 'Options:', opts_help);

  var cmd_help = [];
  if (syntax.commands) {
    @propertyPairs(syntax.commands) .. @each {
      |[name,descr]|
      cmd_help.push("    #{name}#{descr.summary_txt? ': '+descr.summary_txt : ''}");
    }
  }
  
  if (cmd_help.length) {
    var help_cmd = [command_path[0], 'help'].concat(command_path.slice(1), 'COMMAND').join(' ');
    rv = rv.concat('', 'Commands:', cmd_help, '', "Run '#{help_cmd}' for help on individual commands.");
  }
  rv.push("Run '#{command_path[0]} help' for full commandline help.");
  return rv.join('\n');
}

function dispatch(syntax, argv, command_path) {
  if (!command_path) command_path = [syntax.name || "#{process.argv[0]} #{process.argv[1]}"];
  var exec;
  var pars = {};
  pars.opts = peelOpts(argv, syntax.opts);
  if (argv.length && syntax.commands && syntax.commands[argv[0]]) {
    var command_name = argv.shift();
    [exec, subpars] = dispatch(syntax.commands[command_name], argv, command_path.concat(command_name));
    subpars[0].command = command_name;
    return [exec, [pars].concat(subpars)];
  }
  else if (argv.length && command_path.length === 1 && argv[0] === 'help') {
    argv.shift();
    console.log(formatHelp(syntax, command_path, argv));
    process.exit(0);
  }
  else {
    if (!syntax.exec) {
      // parse error 
      console.log(formatHelp(syntax, command_path, argv));
      process.exit(1);
    }
    pars.args = argv;
    return [syntax.exec, [pars]];
  }
}
exports.dispatch = dispatch;



