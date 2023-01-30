@cgi-fr/salesforce-toolbox
==========================

A plugin for SFDX to make Salesforce developers' life easier ! Made by Philippe Planchon for CGI ©.

[![Version](https://img.shields.io/npm/v/@cgi-fr/salesforce-toolbox.svg)](https://npmjs.org/package/@cgi-fr/salesforce-toolbox)
[![Downloads/week](https://img.shields.io/npm/dw/@cgi-fr/salesforce-toolbox.svg)](https://npmjs.org/package/@cgi-fr/salesforce-toolbox)
[![License](https://img.shields.io/npm/l/@cgi-fr/salesforce-toolbox.svg)](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/master/package.json)


Updating local profiles metadata file according to a dev org can be very painful : you have to build a manifest with all needed metadata, then retrieve it, and then you may have to check every single profile file to stage and/or revert all modifications you need or don't need to save.
This is why I created this plugin : it automates all these steps.

This plugin updates your profiles metadata files from your SFDX project with permissions retrieved from a secific Salesforce org.

You only have to decide what should be retrieved, and for this purpose you need to write a configuration file.
Once this configuration file is ready, you just have to launch the plugin and wait for it to update your profiles.
It will update them only for permissions you asked to update, leaving all the rest as it was before.

This plugin doesn't create or delete any profile from your local SFDX project, it can only update existing ones.

# Menu
<!-- toc -->
* [Menu](#menu)
* [Disclaimer](#disclaimer)
* [Installation](#installation)
* [Configuration File](#configuration-file)
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
@cgi-fr/salesforce-toolbox/0.1.0 win32-x64 node-v18.12.1
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->

# Configuration File

A configuration file is needed to tell plugin what permissions have to be retrieved and updated on your local profiles.

Here is a minimal example to retrieve Object Permission for Account object and Field Level Security (FLS) for all fields in Contact object :
```js
{
  "sObjects": [
    {
      "apiName": "Account",
      "retrieveObjectPermissions": true
    },
    {
      "apiName": "Contact",
      "allFieldsPermissions": true
    }
  ]
}
```

You can also tell what specific FLS you want to update :
```js
{
  "sObjects": [
    {
      "apiName": "Account",
      "fieldsPermissionsFor": [
        "Description",
        "my_customField__c"
      ]
    }
  ]
}
```
Or tell other Object-related permissions to retrieve :
```js
{
  "sObjects": [
    {
      "apiName": "Account",
      "retrieveRecordTypeVisibilities": true,
      "retrievelayoutAssignments": true
    }
  ]
}
```
You can also retrieve non-object-related permissions, here is a full example of what this plugin can retrieve :
(This is the config file generated by the command `sfdx CGI:profiles:initConfig`)
```js
{
  "sObjects": [
    {
      "apiName": "StandardsObject1",
      "retrieveObjectPermissions": false,
      "retrieveRecordTypeVisibilities": true,
      "retrievelayoutAssignments": true,
      "fieldsPermissionsFor": [
        "standardFieldA",
        "customFieldB__c"
      ]
    },
    {
      "apiName": "CustomsObject2__c",
      "retrieveObjectPermissions": true,
      "retrieveRecordTypeVisibilities": false,
      "retrievelayoutAssignments": false,
      "allFieldsPermissions": true
    }
  ],
  "apexClasses": {
    "allPermissions": false,
    "permissionsFor": [
      "AP01_MyApexClass",
      "AP02_MyOtherApexClass"
    ]
  },
  "apexPages": {
    "allPermissions": false,
    "permissionsFor": [
      "VFP01_My_Visualforce_Page",
      "VFP02_TheOtherOne"
    ]
  },
  "customApplications": {
    "allPermissions": false,
    "permissionsFor": [
      "App1",
      "App2"
    ]
  },
  "customMetadataTypes": {
    "allPermissions": false,
    "permissionsFor": [
      "cmt1__mdt",
      "cmt2__mdt"
    ]
  },
  "customPermissions": {
    "allPermissions": false,
    "permissionsFor": [
      "custo_perm_1",
      "custo_perm_2"
    ]
  },
  "customSettings": {
    "allPermissions": false,
    "permissionsFor": [
      "custo_set_1",
      "custo_set_2"
    ]
  },
  "customTabs": {
    "allPermissions": false,
    "permissionsFor": [
      "custo_tab_1",
      "custo_tab_2"
    ]
  },
  "userPermissions": {
    "allPermissions": false,
    "permissionsFor": [
      "custo_tab_1",
      "custo_tab_2"
    ]
  },
  "externalDataSource": {
    "allPermissions": false,
    "permissionsFor": [
      "ext_source_1",
      "ext_source_2"
    ]
  },
  "loginIpRanges": true,
  "loginHours": true
}
```

# Commands 

<!-- commands -->
* [`sfdx CGI:profiles:initConfig [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-cgiprofilesinitconfig---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx CGI:profiles:update [-c <filepath>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-cgiprofilesupdate--c-filepath--v-string--u-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx CGI:profiles:initConfig [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Initialize the config file to run 'sfdx CGI:profiles:update' command

```
USAGE
  $ sfdx CGI:profiles:initConfig [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

FLAGS
  --json                                                                            format output as json
  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

DESCRIPTION
  Initialize the config file to run 'sfdx CGI:profiles:update' command

EXAMPLES
  $ sfdx CGI:profiles:initConfig
```

_See code: [src/commands/CGI/profiles/initConfig.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.1.0/src/commands/CGI/profiles/initConfig.ts)_

## `sfdx CGI:profiles:update [-c <filepath>] [-v <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

Update profiles with permissions retrieved from a specified Org, according to the config file.

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
  Update profiles with permissions retrieved from a specified Org, according to the config file.

EXAMPLES
  $ sfdx CGI:profiles:update --targetusername myOrg@example.com --config ./config.json

  $ sfdx CGI:profiles:update -u myOrgAlias -c ./config.json

  $ sfdx CGI:profiles:update
```

_See code: [src/commands/CGI/profiles/update.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.1.0/src/commands/CGI/profiles/update.ts)_
<!-- commandsstop -->
