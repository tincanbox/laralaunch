import { task } from 'gulp';
import * as W from './gulpfile.workspace.js';

const CONFIG = W.CONFIG;

// Fetchs command line arguments
// Also is used as webpack adaptor.
const argv = W.argv;
const docker = W.docker;
const bind = W.bind;

/*============================================================
 * Task Definitions.
 *============================================================
 */

function do_help() {
  return (C, done) => {
    // Do Your Default Things.
    console.log("help");
  }
}

function do_install() {
  return async (C, done) => {
    await docker('run', 'down');
    await docker('run', 'up', '-d', CONFIG.laradock.workspace, ...CONFIG.laradock.target);
    await docker('command', './service/build/bin/bootstrap')
    done();
  }
}

function do_launch() {
  return async (C, done) => {
    await docker('run', 'up', '-d', CONFIG.laradock.workspace, ...CONFIG.laradock.target)
    done();
  }
}

function do_root_job() {
  return async (C, done) => {
    let rootRun = ['run', 'exec', '-T', '--user', 'root', CONFIG.laradock.workspace, '/bin/sh', '-c'];
    let workspaceUserGroup = CONFIG.docker.user + ':' + CONFIG.docker.group;
    let cmds = [
      ['chown', '-R', workspaceUserGroup, './' + CONFIG.service.build],
      ['chown', '-R', workspaceUserGroup, './service/storage'],
      ['chmod', '-R', 'ug+x', './' + CONFIG.service.build],
      ['mkdir -p', './service/vendor'],
      ['chown', workspaceUserGroup, './service/vendor']
    ];
    for (let cmd of cmds) {
      await docker.apply(this,
        rootRun.concat(cmd.join(' '))
      );
    }
    done();
  }
}

function do_copy() {
  return async (C, done) => {
    await W.copy(__dirname + '/build/laradock', __dirname + '/laradock');
    await W.copy(__dirname + '/build/service', __dirname + '/service');
    done();
  }
}

function do_stop() {
  return (C, done) => {
    docker('run', 'stop')
      .then(done)
  }
}

function do_destroy() {
  return async (C, done) => {
    await docker('run', 'stop');
    await docker('run', 'down');
    done();
  }
}

function do_login() {
  return (C, done) => {
    W.term('Direct shell login is ') + W.term.red('NOT SUPPORTED') + W.term('. Use command described below.\n');
    W.term.yellow(W.generate_docker_command('shell').join(' ') + '\n');
    done();
  }
}

function do_recreate() {
  return async (C, done) => {
    await docker('run', 'stop');
    await docker('run', 'down');
    await W.copy(__dirname + '/build/laradock', __dirname + '/laradock');
    await docker('run', 'build', CONFIG.laradock.workspace, ...CONFIG.laradock.target);
    await docker('run', 'up', '-d', CONFIG.laradock.workspace, ...CONFIG.laradock.target)
    done();
  }
}

task('default', bind('series', do_help()));
task('install', bind('series', do_copy(), do_launch(), do_root_job(), do_install()));
task('launch',  bind('series', do_launch(), do_root_job()));
task('login',   bind('series', do_login()));
task('halt',    bind('series', do_stop()));
task('destroy', bind('series', do_destroy()));
task('recreate',bind('series', do_recreate(), do_root_job()));
