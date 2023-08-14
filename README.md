@cgi-fr/salesforce-toolbox
==========================

A plugin for SFDX to make Salesforce developers' life easier ! Made by Philippe Planchon for CGI ©.

[![Version](https://img.shields.io/npm/v/@cgi-fr/salesforce-toolbox.svg)](https://npmjs.org/package/@cgi-fr/salesforce-toolbox)
[![Downloads/week](https://img.shields.io/npm/dw/@cgi-fr/salesforce-toolbox.svg)](https://npmjs.org/package/@cgi-fr/salesforce-toolbox)
[![License](https://img.shields.io/npm/l/@cgi-fr/salesforce-toolbox.svg)](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/master/package.json)


Updating local profile or translation metadata file according to a dev org can be very painful : you have to build a manifest with all needed metadata, then retrieve it, and then you may have to check every single profile or translation file to stage and/or revert all modifications you need or don't need to save.
This is why I created this plugin : it automates all these steps.

This plugin updates your profile or translation metadata files from your SFDX project with permissions/translations retrieved from a secific Salesforce org.

You only have to decide what should be retrieved, and for this purpose you need to write a configuration file.
Once this configuration file is ready, you just have to launch the needed plugin command and wait for it to update your profiles or translations files.
It will update them only for permissions/translations you asked to update, leaving all the rest as it was before.

This plugin doesn't create or delete any profile from your local SFDX project, it can only update existing ones.
It creates/updates/deletes translation files.

# Menu
<!-- toc -->
* [Menu](#menu)
* [Disclaimer](#disclaimer)
* [Installation](#installation)
* [Profile update Configuration File](#profile-update-configuration-file)
* [Translation update Configuration File](#translation-update-configuration-file)
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

<!-- usagestop -->

# Profile update Configuration File

A configuration file is needed to tell plugin what permissions have to be retrieved and updated on your local profiles.
Run command `sfdx CGI:profiles:initConfig` to generate one, and then edit it.

When you give a name for any element (sObject name, custom field name, apex page name, etc...), the plugin expects the exact API name of this element (case sensitive).

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
      "fields": {
        "allPermissions": true
      }
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
      "fields": {
        "permissionsFor": [
          "Description",
          "my_customField__c"
        ]
      }
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
      "retrieveLayoutAssignments": true
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
      "retrieveLayoutAssignments": true,
      "fields": {
        "permissionsFor": [
          "standardFieldA",
          "customFieldB__c"
        ]
      }
    },
    {
      "apiName": "CustomsObject2__c",
      "retrieveObjectPermissions": true,
      "retrieveRecordTypeVisibilities": false,
      "retrieveLayoutAssignments": false,
      "fields": {
        "allPermissions": true
      }
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

# Translation update Configuration File

A configuration file is needed to tell plugin what translations have to be retrieved and created/updated/deleted regarding your local translation files.
Run command `sfdx CGI:translations:initConfig` to generate one, and then edit it.

When you give a name for any element (sObject name, custom field name, custom label name, etc...), the plugin expects the exact API name of this element (case sensitive).

Here is a minimal example to retrieve object renamed translations for Account sObject and all field translations on Contact sObject :

```js
{
  "sObjects": [
    {
      "apiName": "Account",
      "retrieveObjectRenameTranslations": true
    },
    {
      "apiName": "Contact",
      "fields": {
        "allTranslations": true
      }
    }
  ]
}
```

You can also tell what specific field translations you want to update :
```js
{
  "sObjects": [
    {
      "apiName": "Account",
      "fields": {
        "translationsFor": [
          "standardFieldA",
          "customFieldB__c"
        ]
      }
    }
  ]
}
```
You can also retrieve non-object-related translations, here is a full example of what this command can retrieve :
(This is the config file generated by the command `sfdx CGI:translations:initConfig`)
```js
{
  "sObjects": [
    {
      "apiName": "sObject1",
      "fields": {
        "allTranslations": true
      }
    },
    {
      "apiName": "sObject2",
      "retrieveObjectRenameTranslations": false,
      "fields": {
        "allTranslations": false,
        "translationsFor": [
          "standardFieldA",
          "customFieldB__c"
        ]
      },
      "layouts": {
        "allTranslations": false,
        "translationsFor": [
          "layout1",
          "layout2"
        ]
      },
      "fieldSets": {
        "allTranslations": false,
        "translationsFor": [
          "fieldSet1",
          "fieldSet2"
        ]
      },
      "quickActions": {
        "allTranslations": false,
        "translationsFor": [
          "quickAction1",
          "quickAction2"
        ]
      },
      "recordTypes": {
        "allTranslations": false,
        "translationsFor": [
          "record_type_1",
          "record_type_2"
        ]
      },
      "sharingReasons": {
        "allTranslations": false,
        "translationsFor": [
          "sharingReason1",
          "sharingReason2"
        ]
      },
      "validationRules": {
        "allTranslations": false,
        "translationsFor": [
          "vr01",
          "vr02"
        ]
      },
      "webLinks": {
        "allTranslations": false,
        "translationsFor": [
          "button1",
          "link2"
        ]
      }
    }
  ],
  "customApplications": {
    "allTranslations": false,
    "translationsFor": [
      "customApp1",
      "customApp2"
    ]
  },
  "customLabels": {
    "allTranslations": false,
    "translationsFor": [
      "customLabel1",
      "customLabel2"
    ]
  },
  "flows": {
    "allTranslations": false,
    "translationsFor": [
      "flow1",
      "flow2"
    ]
  },
  "globalQuickActions": {
    "allTranslations": false,
    "translationsFor": [
      "globalQuickActions1",
      "globalQuickActions2"
    ]
  },
  "reportTypes": {
    "allTranslations": false,
    "translationsFor": [
      "reportTypes1",
      "reportTypes2"
    ]
  }
}
```
# Commands 

<!-- commands -->
* [`sfdx CGI:profiles:initConfig`](#sfdx-cgiprofilesinitconfig)
* [`sfdx CGI:profiles:update`](#sfdx-cgiprofilesupdate)
* [`sfdx CGI:translations:initConfig`](#sfdx-cgitranslationsinitconfig)
* [`sfdx CGI:translations:update`](#sfdx-cgitranslationsupdate)

## `sfdx CGI:profiles:initConfig`

Initialize the config file to run 'sfdx CGI:profiles:update' command

```
USAGE
  $ sfdx CGI:profiles:initConfig [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Initialize the config file to run 'sfdx CGI:profiles:update' command

EXAMPLES
  $ sfdx CGI:profiles:initConfig
```

_See code: [src/commands/CGI/profiles/initConfig.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.2.4/src/commands/CGI/profiles/initConfig.ts)_

## `sfdx CGI:profiles:update`

Update all profiles with permissions retrieved from a specified Org, according to the config file.

```
USAGE
  $ sfdx CGI:profiles:update -o <value> [--json] [-c <value>]

FLAGS
  -c, --config=<value>      Path to the config file - Optionnal. If not provided, it will be loaded from the default
                            location. If it does not exist, throw an error.
  -o, --target-org=<value>  (required) Username or alias of the target org.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Update all profiles with permissions retrieved from a specified Org, according to the config file.

EXAMPLES
  $ sfdx CGI:profiles:update --target-org myOrg@example.com --config ./config.json

  $ sfdx CGI:profiles:update -o myOrgAlias -c ./config.json

  $ sfdx CGI:profiles:update
```

_See code: [src/commands/CGI/profiles/update.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.2.4/src/commands/CGI/profiles/update.ts)_

## `sfdx CGI:translations:initConfig`

Initialize the config file to run 'sfdx CGI:translations:update' command

```
USAGE
  $ sfdx CGI:translations:initConfig [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Initialize the config file to run 'sfdx CGI:translations:update' command

EXAMPLES
  $ sfdx CGI:translations:initConfig
```

_See code: [src/commands/CGI/translations/initConfig.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.2.4/src/commands/CGI/translations/initConfig.ts)_

## `sfdx CGI:translations:update`

Update translations retrieved from a specified Org, according to the config file, for all active language in the target org.

```
USAGE
  $ sfdx CGI:translations:update -o <value> [--json] [-c <value>]

FLAGS
  -c, --config=<value>      Path to the config file - Optionnal. If not provided, it will be loaded from the default
                            location. If it does not exist, throw an error.
  -o, --target-org=<value>  (required) Username or alias of the target org.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Update translations retrieved from a specified Org, according to the config file, for all active language in the
  target org.

EXAMPLES
  $ sfdx CGI:translations:update --target-org myOrg@example.com --config ./config.json

  $ sfdx CGI:translations:update -o myOrgAlias -c ./config.json

  $ sfdx CGI:translations:update
```

_See code: [src/commands/CGI/translations/update.ts](https://github.com/CGI-Shapsha/Salesforce-Toolbox/blob/v0.2.4/src/commands/CGI/translations/update.ts)_
<!-- commandsstop -->
