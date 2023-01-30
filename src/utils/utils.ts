import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { ComponentSet, MetadataResolver, registry, SourceComponent } from '@salesforce/source-deploy-retrieve';
import { UX } from '@salesforce/command';
import { Connection, NamedPackageDir, SfError } from '@salesforce/core';
import { FileProperties } from 'jsforce/lib/api/metadata';
import { ListMetadataQuery } from '@salesforce/source-deploy-retrieve/lib/src/client/types';
import { deleteDirRecursive } from './dirManagment';
import { ProfileItem, ConfigType, ManifestType, TypeMembersType, ProfileInfoType, ParsedProfile, GenericConfigType, ProfileCustom, CustomTabLightType } from './typeDefs';

const sortProfile = function (profileJson: ParsedProfile): ParsedProfile {
    if (!profileJson || !Object.prototype.hasOwnProperty.call(profileJson, 'Profile')) return undefined;

    const profile: ProfileCustom = profileJson.Profile;
    const sortMapping = {
        applicationVisibilities: 'application',
        classAccesses: 'apexClass',
        customMetadataTypeAccesses: 'name',
        customPermissions: 'name',
        customSettingAccesses: 'name',
        fieldPermissions: 'field',
        flowAccesses: 'flow',
        layoutAssignments: 'layout',
        objectPermissions: 'object',
        pageAccesses: 'apexPage',
        recordTypeVisibilities: 'recordType',
        tabVisibilities: 'tab',
        userPermissions: 'name',
    };

    for (const [metaType, propForSort] of Object.entries(sortMapping)) {
        if (Object.prototype.hasOwnProperty.call(profile, metaType)) {
            if(!profile[metaType]) {
                delete profile[metaType];
                continue;
            }
            profile[metaType] = customSort(profile[metaType], propForSort);
        }
    }

    profileJson.Profile = Object.keys(profile)
        .sort()
        .reduce((obj, key: string) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            obj[key] = profile[key];
            return obj;
        }, {}) as ProfileCustom;

    return profileJson;
}

const customSort = function (arr: ProfileItem[], prop: string): ProfileItem[] {
    return arr.sort((a: ProfileItem, b: ProfileItem): number => a[prop] < b[prop] ? -1 : 1);
}

// eslint-disable-next-line complexity
const getConfig = async function (configPath: string): Promise<ConfigType> {
    if (!fs.existsSync(path.resolve(configPath))) {
        throw new SfError('Config file does not exists ! Please run sfdx CGI:profiles:initConfig');
    }

    const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8')) as ConfigType;

    config.isFieldPermissions = !!config.sObjects && !!config.sObjects.find(sObj => (sObj.fieldsPermissionsFor && sObj.fieldsPermissionsFor.length > 0) || !!sObj.allFieldsPermissions);
    config.isObjectPermissions = !!config.sObjects && !!config.sObjects.find(sObj => sObj.retrieveObjectPermissions === true);
    config.isRecordTypePermissions = !!config.sObjects && !!config.sObjects.find(sObj => sObj.retrieveRecordTypeVisibilities === true);
    config.isLayoutAssignments = !!config.sObjects && !!config.sObjects.find(sObj => sObj.retrieveLayoutAssignments === true);
    config.isApexPermissions = checkGenericConfig(config.apexClasses);
    config.isPagePermissions = checkGenericConfig(config.apexPages);
    config.isCustomApplicationPermissions = checkGenericConfig(config.customApplications);
    config.isCustomMetadataPermissions = checkGenericConfig(config.customMetadataTypes);
    config.isCustomPermissionPermissions = checkGenericConfig(config.customPermissions);
    config.isCustomSettingPermissions = checkGenericConfig(config.customSettings);
    config.isCustomTabPermissions = checkGenericConfig(config.customTabs);
    config.isUserPermissions = checkGenericConfig(config.userPermissions);
    config.isExternalDataSource = checkGenericConfig(config.externalDataSource);

    if (!(config.isApexPermissions  
        || config.isPagePermissions
        || config.isFieldPermissions 
        || config.isObjectPermissions 
        || config.isRecordTypePermissions 
        || config.isLayoutAssignments 
        || config.isCustomApplicationPermissions
        || config.isCustomMetadataPermissions
        || config.isCustomPermissionPermissions
        || config.isCustomSettingPermissions
        || config.loginIpRanges
        || config.loginHours
        || config.isCustomTabPermissions
        || config.isUserPermissions
        || config.isExternalDataSource)) {
        throw new SfError('Config file contains no permissions to retrieve ! Please edit it.');
    }

    return config;
}

const checkGenericConfig = function (genericConfig: GenericConfigType): boolean {
    if (!genericConfig) return false;

    return (genericConfig.allPermissions || (!!genericConfig.permissionsFor && genericConfig.permissionsFor.length > 0));
}

const readXml = async function (xmlPath: string): Promise<Record<string, unknown>> {
    const profileRaw = await fs.promises.readFile(xmlPath);

    const parser = new xml2js.Parser();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const parserPromised: (buffer: Buffer) => Promise<Record<string, unknown>> = promisify(parser.parseString);

    return parserPromised(profileRaw);
}

const writeXml = async function (xmlPath: string, jsonContent: Record<string, unknown>): Promise<void> {
    const builderOptions: xml2js.BuilderOptions = {
        renderOpts: { pretty: true, indent: '    ', newline: '\n' },
        xmldec: { version: '1.0', encoding: 'UTF-8' },
    };
    const builder = new xml2js.Builder(builderOptions);
    const xml = builder.buildObject(jsonContent);
    await fs.promises.writeFile(xmlPath, xml + '\n');
}

const generateManifest = async function (
    config: ConfigType,
    layoutList: FileProperties[],
    cmtList: FileProperties[],
    customSetingList: string[],
    customTabList: CustomTabLightType[],
    apiVersion: string,
    workingDirPath: string,
    manifestFileName: string
): Promise<string> {
    const manifestFilePath = path.join(workingDirPath, manifestFileName);

    let manifestJSON: ManifestType = {
        Package: {
            $: {
                xmlns: 'http://soap.sforce.com/2006/04/metadata',
            },
            types: [],
            version: apiVersion,
        },
    };

    if ( config.isObjectPermissions
        || config.isFieldPermissions
        || config.isRecordTypePermissions
        || config.isLayoutAssignments
        || config.isCustomMetadataPermissions
        || config.isCustomSettingPermissions
        || config.isCustomTabPermissions) {
        manifestJSON = addSObjectsToManifest(manifestJSON, config, cmtList, customSetingList, customTabList);
    }

    if (config.isLayoutAssignments) {
        manifestJSON = addLayoutsToManifest(manifestJSON, config, layoutList);
    }

    if (config.isApexPermissions) {
        manifestJSON = addGenericMetadataToManifest(manifestJSON, config.apexClasses, registry.types.apexclass.name);
    }

    if (config.isPagePermissions) {
        manifestJSON = addGenericMetadataToManifest(manifestJSON, config.apexPages, registry.types.apexpage.name);
    }

    if (config.isCustomApplicationPermissions) {
        manifestJSON = addGenericMetadataToManifest(manifestJSON, config.customApplications, registry.types.customapplication.name);
    }

    if (config.isCustomPermissionPermissions) {
        manifestJSON = addGenericMetadataToManifest(manifestJSON, config.customPermissions, registry.types.custompermission.name);
    }

    if (config.isCustomTabPermissions) {
        manifestJSON = addCustomTabsToManifest(manifestJSON, config.customTabs);
    }

    if (config.isExternalDataSource) {
        manifestJSON = addGenericMetadataToManifest(manifestJSON, config.externalDataSource, registry.types.externaldatasource.name);
    }

    manifestJSON.Package.types.push({
        members: [{ _: '*' }],
        name: registry.types.profile.name,
    });

    await writeXml(manifestFilePath, manifestJSON);

    return manifestFilePath;
}

// eslint-disable-next-line complexity
const addSObjectsToManifest = function(
    manifestJSON: ManifestType,
    config: ConfigType,
    cmtList: FileProperties[],
    customSetingList: string[],
    customTabList: CustomTabLightType[]
): ManifestType {

    const sObjectSet: Set<string> = new Set<string>();
    const customObjectsMembers: TypeMembersType[] = [];

    if ( config.isObjectPermissions
        || config.isFieldPermissions
        || config.isRecordTypePermissions
        || config.isLayoutAssignments) {
        for (const sObject of config.sObjects) {
            sObjectSet.add(sObject.apiName);
        }
    }

    if (config.isCustomMetadataPermissions) {
        if (config.customMetadataTypes.allPermissions) {
            for (const cmt of cmtList) {
                sObjectSet.add(cmt.fullName);
            }
        } else if (config.customMetadataTypes.permissionsFor.length > 0){
            for (const cmt of config.customMetadataTypes.permissionsFor) {
                sObjectSet.add(cmt);
            }

        }
    }

    if (config.isCustomSettingPermissions) {
        if (config.customSettings.allPermissions) {
            for (const custSet of customSetingList) {
                sObjectSet.add(custSet);
            }
        } else if (config.customSettings.permissionsFor.length > 0){
            for (const custSet of config.customSettings.permissionsFor) {
                sObjectSet.add(custSet);
            }

        }
    }

    if (config.isCustomTabPermissions) {
        if (config.customTabs.allPermissions) {
            for (const custTab of customTabList) {
                if (custTab.name.startsWith('standard-')) {
                    sObjectSet.add(custTab.sobjectName);
                }
            }
        } else if (config.customTabs.permissionsFor.length > 0){
            for (const custTab of config.customTabs.permissionsFor) {
                if (custTab.startsWith('standard-')) {
                    sObjectSet.add(custTab.split('-')[1]);
                }
            }
        }
    }

    for (const sObj of sObjectSet) {
        customObjectsMembers.push({
            _: sObj
        });
    }

    manifestJSON.Package.types.push({
        members: customObjectsMembers,
        name: registry.types.customobject.name,
    });

    return manifestJSON;
}

const addLayoutsToManifest = function(manifestJSON: ManifestType, config: ConfigType, layoutList: FileProperties[]): ManifestType {
    const layoutMembers: TypeMembersType[] = [];

    for (const sObject of config.sObjects) {
        if (sObject.retrieveLayoutAssignments) {
            for (const layoutItem of layoutList) {
                if (layoutItem.fullName.startsWith(`${sObject.apiName}-`)) {
                    layoutMembers.push({
                        _: layoutItem.fullName,
                    });
                }
            }
        }
    }

    manifestJSON.Package.types.push({
        members: layoutMembers,
        name: registry.types.layout.name,
    });
    
    return manifestJSON;
}

const addGenericMetadataToManifest = function(manifestJSON: ManifestType, configType: GenericConfigType, metadataName: string): ManifestType {
    const typeMembers: TypeMembersType[] = [];

    if (configType.allPermissions) {
        typeMembers.push({
            _: '*',
        })
    } else {
        for (const elementName of configType.permissionsFor) {
            typeMembers.push({
                _: elementName,
            })
        }
    }

    manifestJSON.Package.types.push({
        members: typeMembers,
        name: metadataName
    })
    
    return manifestJSON;
}

const addCustomTabsToManifest = function(manifestJSON: ManifestType, configType: GenericConfigType): ManifestType {
    const typeMembers: TypeMembersType[] = [];

    if (configType.allPermissions) {
        typeMembers.push({
            _: '*',
        })
    } else {
        for (const elementName of configType.permissionsFor) {
            if (!elementName.startsWith('standard-')) {
                typeMembers.push({
                    _: elementName,
                })
            }
        }
    }

    if (typeMembers.length > 0) {
        manifestJSON.Package.types.push({
            members: typeMembers,
            name: registry.types.customtab.name
        })
    }
    
    return manifestJSON;
}

const retreiveFromManifest = async function (
    manifestPath: string,
    tempProjectPath: string,
    orgUsername: string
): Promise<void> {
    const ux = await UX.create();

    if (fs.existsSync(tempProjectPath)) {
        await deleteDirRecursive(tempProjectPath);
    }

    const set = await ComponentSet.fromManifest({
        manifestPath,
        forceAddWildcards: true,
    });
    const retrieve = await set.retrieve({
        usernameOrConnection: orgUsername,
        output: tempProjectPath,
        merge: true,
    });

    ux.startSpinner('Retrieving Metadata', 'Initializing');
    retrieve.onUpdate(({ status }) => {
        ux.setSpinnerStatus(status);
    });
    await retrieve.pollStatus();
    ux.stopSpinner('✔️\n');
}

const loadProfileFromPackageDirectories = function (
    projectPath: string,
    projectPackageDirectories?: NamedPackageDir[],
    userDefPackageDirectories?: string[]
): ProfileInfoType[] {
    const resolver = new MetadataResolver();
    let profiles: SourceComponent[] = [];
    let packageDirectories: string[] = [];

    if (!userDefPackageDirectories || userDefPackageDirectories.length === 0) {
        packageDirectories = new Array<string>();
        for (const packageDirectory of projectPackageDirectories) {
            packageDirectories.push(packageDirectory.path);
        }
    } else {
        packageDirectories = userDefPackageDirectories;
    }

    packageDirectories = packageDirectories.map((packDir) => path.join(projectPath, packDir));

    for (const packageDirectory of packageDirectories) {
        profiles = profiles.concat(
            resolver.getComponentsFromPath(
                packageDirectory,
                new ComponentSet([{ fullName: '*', type: registry.types.profile.name }])
            )
        );
    }

    const profileSourceFile: ProfileInfoType[] = profiles.map((elem) => ({ profilename: elem.name, filename: path.basename(elem.xml), path: elem.xml }));
    return profileSourceFile;
}

const getMetadataList = async function (connection: Connection, metadataName: string): Promise<FileProperties[]> {
    
    const listmetadataQuery: ListMetadataQuery = {
        type: metadataName
    };
    const metadataList = await connection.metadata.list(listmetadataQuery);

    return metadataList;
}

const getAllCustomSettingList = async function (connection: Connection): Promise<string[]> {
    const ret: string[] = [];
    const globalDesc = await connection.describeGlobal();
    for (const obj of globalDesc.sobjects) {
        if (obj.customSetting) {
            ret.push(obj.name);
        }
    }

    return ret;
}

const getAllCustomTabList = async function (connection: Connection, apiVersion: string): Promise<CustomTabLightType[]> {
    const ret: CustomTabLightType[] = [];
    const toolingRequest: CustomTabLightType[] = await connection.tooling.request(`/services/data/v${apiVersion}/tabs`);
    for (const {name, sobjectName} of toolingRequest) {
        ret.push({name, sobjectName});
    }

    return ret;
}

export {
    sortProfile,
    getConfig,
    readXml,
    writeXml,
    generateManifest,
    retreiveFromManifest,
    loadProfileFromPackageDirectories,
    getMetadataList,
    getAllCustomSettingList,
    getAllCustomTabList
};
