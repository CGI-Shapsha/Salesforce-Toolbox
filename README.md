@cgi-fr/salesforce-toolbox
==========================

A plugin for SFDX to make Salesforce developers' life easier ! Made by Philippe Planchon for CGI ©.

[![Version](https://img.shields.io/npm/v/@cgi-fr/salesforce-toolbox.svg)](https://npmjs.org/package/@cgi-fr/salesforce-toolbox)
[![CircleCI](https://circleci.com/gh/CGI-Shapsha/Salesforce-Toolbox/tree/master.svg?style=shield)](https://circleci.com/gh/CGI-Shapsha/Salesforce-Toolbox/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/CGI-Shapsha/Salesforce-Toolbox?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/Salesforce-Toolbox/branch/master)
[![Greenkeeper](https://badges.greenkeeper.io/CGI-Shapsha/Salesforce-Toolbox.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/CGI-Shapsha/Salesforce-Toolbox/badge.svg)](https://snyk.io/test/github/CGI-Shapsha/Salesforce-Toolbox)
[![Downloads/week](https://img.shields.io/npm/dw/@cgi-fr/salesforce-toolbox.svg)](https://npmjs.org/package/@cgi-fr/salesforce-toolbox)
[![License](https://img.shields.io/npm/l/@cgi-fr/salesforce-toolbox.svg)](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/master/package.json)

<!-- toc -->
* [Disclaimer](#disclaimer)
* [Installation](#installation)
* [Commands](#commands)
<!-- tocstop -->

# Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
SOFTWARE.

# Installation

```sh-session
$ sfdx plugins:install @cgi-fr/salesforce-toolbox
```

OR :

<!-- install -->


<!-- usage -->
```sh-session
$ npm install -g @cgi-fr/salesforce-toolbox
$ sfdx COMMAND
running command...
$ sfdx (--version)
@cgi-fr/salesforce-toolbox/0.0.1 win32-x64 node-v18.12.1
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->

# Commands 

<!-- commands -->
* [`sfdx CGI:profiles:initConfig [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-cgiprofilesinitconfig---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx CGI:profiles:update [-c <filepath>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-cgiprofilesupdate--c-filepath--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx CGI:profiles:initConfig [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Initialize the config file to run CGI:profile:update command

```
USAGE
  $ sfdx CGI:profiles:initConfig [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  Initialize the config file to run CGI:profile:update command

EXAMPLES
  $ sfdx CGI:profiles:initConfig
```

_See code: [src/commands/CGI/profiles/initConfig.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.0.1/src/commands/CGI/profiles/initConfig.ts)_

## `sfdx CGI:profiles:update [-c <filepath>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Update profiles with field level security and object permissions retrieved from a specified Org, according to the config file.

```
USAGE
  $ sfdx CGI:profiles:update [-c <filepath>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel
    trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  -c, --config=<value>                                                              Path to the config file - Optionnal.
                                                                                    If not provided, it will be loaded
                                                                                    from the default location. If it
                                                                                    does not exist, throw an error.
  -u, --targetusername=<value>                                                      username or alias for the target
                                                                                    org; overrides default target org
  -v, --targetdevhubusername=<value>                                                username or alias for the dev hub
                                                                                    org; overrides default dev hub org
  --apiversion=<value>                                                              override the api version used for
                                                                                    api requests made by this command
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  Update profiles with field level security and object permissions retrieved from a specified Org, according to the
  config file.

EXAMPLES
  $ sfdx CGI:profiles:update --targetusername myOrg@example.com --config ./config.json

  $ sfdx CGI:profiles:update -u myOrgAlias -c ./config.json

  $ sfdx CGI:profiles:update
```

_See code: [src/commands/CGI/profiles/update.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.0.1/src/commands/CGI/profiles/update.ts)_
<!-- commandsstop -->
