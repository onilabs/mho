@ = require([
  'mho:std',
  {id:'mho:services/docker/REST/v1-25', name:'dockerREST'},
  {id:'mho:services/docker/highlevel', name:'docker_highlevel'}
]);

function exitWithError(txt) {
  process.stdout.write('\n'+txt+'\nExiting.\n');
  process.exit(1);
}

exports.runSubContainer = function(docker, settings) {

  settings = {
    Image: undefined,
    ports: [],
    args: [],
    allowFailure: false
  } .. @override(settings);

  var tty_mode = process.stdin.isTTY;

  var PortBindings = settings.ports .. 
    @transform(p -> [String(p), [{HostPort:String(p)}]]) ..
    @pairsToObject;
  var ExposedPorts = settings.ports ..
    @transform(p -> [String(p), {}]) ..
    @pairsToObject;
  

  // create container:
  var {Id: container_id} = docker .. @dockerREST.containerCreate({
    body: {
      Image: settings.Image,
      OpenStdin: true,
      Tty: tty_mode, 
      HostConfig: {
        AutoRemove: true,
        NetworkMode: 'bridge',
        PortBindings: PortBindings,
      },
      ExposedPorts: ExposedPorts,
      Cmd: settings.args
    }
  });

  waitfor {
    docker .. @dockerREST.containerAttach({
      id: container_id,
      stream: true,
      stderr: true,
      stdout: true,
      stdin:  true
    }) { 
      |incoming|
      waitfor {
        if (tty_mode) {
          incoming.socket .. @stream.contents() .. @each { 
            |x|
            process.stdout.write(x);
          }
        }
        else {
          // non-tty; streams are multiplexed:
          incoming.socket .. @docker_highlevel.parseMultiplexedStdOutErr .. @each {
            |{content}|
            process.stdout.write(content);
          }
        }
        break;
      }
      and {
        try {
          if (tty_mode)
            process.stdin.setRawMode(true);
          @stream.pump(process.stdin, incoming.socket);
        }
        finally {
          if (tty_mode)
            process.stdin.setRawMode(false);
        }
      }
    } /* containerAttach */
  }
  and {
    docker .. @dockerREST.containerStart({id:container_id});
    // XXX what happens if the container exits and is auto-removed before we call wait?
    var exitStatus = (docker .. @dockerREST.containerWait({
      id: container_id}));
    if (exitStatus.StatusCode !== 0) {
      if (!settings.allowFailure) 
        exitWithError("Container #{container_id} exited with non-zero exit status.");
      return false;
    }
  }
  catch(e) {
    try {
      docker .. @dockerREST.containerStop({id:container_id});
    }
    catch(f) { /* ignore */ }
    throw e;
  }
  return true;

};

