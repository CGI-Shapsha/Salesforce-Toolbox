import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { ComponentSet, MetadataResolver, registry, SourceComponent } from '@salesforce/source-deploy-retrieve';
import { UX } from '@salesforce/command';
import { NamedPackageDir, SfError } from '@salesforce/core';
import { deleteDirRecursive } from './dirManagment';
import { Profile, ProfileItem, ConfigType, ManifestType, TypeMembersType, ProfileInfoType } from './typeDefs';

const sortProfile = function (profileJson: Record<string, unknown>): Record<string, unknown> {
    if (!profileJson || !Object.prototype.hasOwnProperty.call(profileJson, 'Profile')) return {};

    const profile: Profile = profileJson.Profile;
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
            profile[metaType] = customSort(profile[metaType], propForSort);
        }
    }

    profileJson.Profile = Object.keys(profile)
        .sort()
        .reduce((obj, key: string) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            obj[key] = profile[key];
            return obj;
        }, {});

    return profileJson;
};

const customSort = function (arr: ProfileItem[], prop: string): ProfileItem[] {
    return arr.sort((a: ProfileItem, b: ProfileItem): number => {
        return a[prop] < b[prop] ? -1 : 1;
    });
};

const updatePermissions = function (
    currentProfileJson: Record<string, unknown>,
    updatedProfileJson: Record<string, unknown>,
    fieldsToUpdatePermissions: string[][],
    objectsToUpdatePermissions: string[][]
): Record<string, unknown> {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: Profile = currentProfileJson.Profile;
    const updatedProfile: Profile = updatedProfileJson.Profile;

    let allExistingFieldPermissions = currentProfile.fieldPermissions;
    const allUpdatedFieldPermissions = updatedProfile.fieldPermissions;

    let allExistingObjectPermissions = currentProfile.objectPermissions;
    const allUpdatedObjectPermissions = updatedProfile.objectPermissions;

    // removing existing fieldPermission for explicit fields
    allExistingFieldPermissions =
        allExistingFieldPermissions?.filter((fp) => {
            return !JSON.stringify(fieldsToUpdatePermissions).includes(JSON.stringify(fp.field));
        }) ?? [];

    // removing field permission for sObjects with allFields = true
    const allFieldSetForObj = fieldsToUpdatePermissions.filter((field) => {
        return field[0].includes('*');
    });
    if (allFieldSetForObj && allFieldSetForObj.length > 0) {
        for (const allF of allFieldSetForObj) {
            allExistingFieldPermissions = allExistingFieldPermissions.filter((fp) => {
                return !fp.field[0].startsWith(allF[0].split('*')[0]);
            });
        }
    }

    // remove existing objectPermission
    allExistingObjectPermissions =
        allExistingObjectPermissions?.filter((op) => {
            return !JSON.stringify(objectsToUpdatePermissions).includes(JSON.stringify(op.object));
        }) ?? [];

    // add new FieldPermissions
    for (const field of fieldsToUpdatePermissions) {
        if (field[0].includes('*')) {
            // adding field permissions for sObjects with allFields = true
            allExistingFieldPermissions = allExistingFieldPermissions.concat(
                allUpdatedFieldPermissions.filter((fp) => {
                    return fp.field[0].startsWith(field[0].split('*')[0]);
                })
            );
        } else {
            // adding field permissions for explicit fields
            const newFP = allUpdatedFieldPermissions.find((fp) => {
                return JSON.stringify(field) === JSON.stringify(fp.field);
            });
            if (!newFP) continue;

            allExistingFieldPermissions.push(newFP);
        }
    }
    currentProfile.fieldPermissions = allExistingFieldPermissions;

    // add new ObjectPermissions
    for (const object of objectsToUpdatePermissions) {
        const newOP = allUpdatedObjectPermissions?.find((op) => {
            return JSON.stringify(object) === JSON.stringify(op.object);
        });
        if (!newOP) continue;

        allExistingObjectPermissions.push(newOP);
    }
    currentProfile.objectPermissions = allExistingObjectPermissions;

    return currentProfileJson;
};

const getConfig = async function (configPath: string): Promise<ConfigType> {
    if (!fs.existsSync(path.resolve(configPath))) {
        throw new SfError('Config file does not exists ! Please run sfdx CGI:profiles:initConfig');
    }

    return JSON.parse(await fs.promises.readFile(configPath, 'utf-8')) as ConfigType;
};

const readXml = async function (xmlPath: string): Promise<Record<string, unknown>> {
    const profileRaw = await fs.promises.readFile(xmlPath);

    const parser = new xml2js.Parser();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const parserPromised: (buffer: Buffer) => Promise<Record<string, unknown>> = promisify(parser.parseString);

    return parserPromised(profileRaw);
};

const writeXml = async function (xmlPath: string, jsonContent: Record<string, unknown>): Promise<void> {
    const builderOptions: xml2js.BuilderOptions = {
        renderOpts: { pretty: true, indent: '    ', newline: '\n' },
        xmldec: { version: '1.0', encoding: 'UTF-8' },
    };
    const builder = new xml2js.Builder(builderOptions);
    const xml = builder.buildObject(jsonContent);
    await fs.promises.writeFile(xmlPath, xml + '\n');
};

const generateManifest = async function (
    config: ConfigType,
    apiVersion: string,
    workingDirPath: string,
    manifestFileName: string
): Promise<string> {
    const manifestFilePath = path.join(workingDirPath, manifestFileName);

    const manifestJSON: ManifestType = {
        Package: {
            $: {
                xmlns: 'http://soap.sforce.com/2006/04/metadata',
            },
            types: [],
            version: apiVersion,
        },
    };
    const customObjectsMembers: TypeMembersType[] = [];
    for (const sObject of config.sObjects) {
        customObjectsMembers.push({
            _: sObject.apiName,
        });
    }

    manifestJSON.Package.types.push({
        members: customObjectsMembers,
        name: 'CustomObject',
    });

    manifestJSON.Package.types.push({
        members: [{ _: '*' }],
        name: 'Profile',
    });

    await writeXml(manifestFilePath, manifestJSON);

    return manifestFilePath;
};

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
    ux.stopSpinner('✔️');
};

const getAllObjectPermissionsToUpdate = function (config: ConfigType): string[][] {
    const ret: string[][] = [];
    config.sObjects.forEach((sObj) => {
        if (sObj.retrieveObjectPermissions) {
            ret.push([sObj.apiName.trim()]);
        }
    });
    return removeDuplicatesFromArray(ret);
};

const getAllFieldsPermissionsToUpdate = function (config: ConfigType): string[][] {
    const ret: string[][] = [];
    config.sObjects.forEach((sObj) => {
        if (sObj.allFields) {
            ret.push([`${sObj.apiName}.*`]);
        } else if (sObj.fields) {
            sObj.fields?.forEach((field) => {
                ret.push([`${sObj.apiName.trim()}.${field.trim()}`]);
            });
        }
    });
    return removeDuplicatesFromArray(ret);
};

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

    packageDirectories = packageDirectories.map((packDir) => {
        return path.join(projectPath, packDir);
    });

    for (const packageDirectory of packageDirectories) {
        profiles = profiles.concat(
            resolver.getComponentsFromPath(
                packageDirectory,
                new ComponentSet([{ fullName: '*', type: registry.types.profile.name }])
            )
        );
    }

    const profileSourceFile: ProfileInfoType[] = profiles.map((elem) => {
        return { profilename: elem.name, filename: path.basename(elem.xml), path: elem.xml };
    });
    return profileSourceFile;
};

const removeDuplicatesFromArray = function (array: string[][]): string[][] {
    // convert string[][] to string[] because we know that all elements are size 1
    let strArr = array.map((elArr) => {
        return elArr[0];
    });
    // delete duplicates values using Set<string>
    strArr = [...new Set(strArr)];
    // rebuild string[][] array
    array = strArr.map((strEl) => {
        return [strEl];
    });

    return array;
};

export {
    sortProfile,
    updatePermissions,
    getConfig,
    readXml,
    writeXml,
    generateManifest,
    retreiveFromManifest,
    getAllObjectPermissionsToUpdate,
    getAllFieldsPermissionsToUpdate,
    loadProfileFromPackageDirectories,
};
