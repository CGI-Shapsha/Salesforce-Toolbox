/* eslint-disable no-await-in-loop */
import * as path from 'path';
import { UX } from '@salesforce/command';
import { registry } from '@salesforce/source-deploy-retrieve';
import { SfError } from '@salesforce/core';
import * as utils from './utils';
import * as permsHelper from './permissionsHelper';
import { configFileName, manifestFileName, tempProjectDirName, workingDirName } from './constants';
import { checkWorkingDir, deleteDirRecursive } from './dirManagment';
import { ParsedProfile, ProfileUpdaterOptionsType } from './typeDefs';

export class ProfileUpdater {
    // eslint-disable-next-line complexity
    public static async doUpdate(options: ProfileUpdaterOptionsType): Promise<void> {
        const ux = await UX.create();

        let configPath = options.configPath;
        const orgUsername = options.orgUsername;
        const projectPath = options.projectPath;
        const projectPackDir = options.projectPackDir;
        const apiVersion = options.apiVersion;
        const tempProjectPath = path.join(projectPath, workingDirName, tempProjectDirName);

        if (!configPath) {
            configPath = path.join(projectPath, workingDirName, configFileName);
        }
        const config = await utils.getConfig(configPath);
        if (!config) {
            return;
        }

        const workingDirPath = await checkWorkingDir(projectPath);

        ux.styledHeader('Generating Manifest File');
        const layoutList = 
            config.isLayoutAssignments ?
            await utils.getMetadataList(options.connection, registry.types.layout.name)
            : undefined;
        const mdtList = config.isCustomMetadataPermissions && config.customPermissions.allPermissions ?
            (await utils.getMetadataList(options.connection, registry.types.customobject.name)).filter(sObject => sObject.fullName.endsWith('__mdt'))
            : undefined;
        const customSetingList = config.isCustomSettingPermissions && config.customSettings.allPermissions ?
            await utils.getAllCustomSettingList(options.connection)
            : undefined;
        const customTabList = config.isCustomTabPermissions && config.customTabs.allPermissions ?
            await utils.getAllCustomTabList(options.connection, options.apiVersion)
            : undefined;

        const manifestPath = await utils.generateManifest(config, layoutList, mdtList, customSetingList, customTabList, apiVersion, workingDirPath, manifestFileName);
        ux.log('Manifest generated.\n');

        ux.styledHeader(`Retreiving Metadata from Salesforce Org using : ${orgUsername}`);
        await utils.retreiveFromManifest(manifestPath, tempProjectPath, orgUsername);

        ux.styledHeader('Updating local profiles');
        ux.startSpinner('Updating local profiles', 'Initializing');

        const fieldsPermissionsToUpdate = config.isFieldPermissions ? permsHelper.getAllFieldsPermissionsToUpdate(config) : [];
        const objectsPermissionsToUpdate = config.isObjectPermissions ? permsHelper.getAllObjectPermissionsToUpdate(config) : [];
        const recordTypePermissionsToUpdate = config.isRecordTypePermissions ? permsHelper.getAllRecordTypePermissionsToUpdate(config) : [];
        const layoutPermissionsToUpdate = config.isLayoutAssignments ? permsHelper.getAllLayoutPermissionsToUpdate(config) : [];
        const apexPermissionsToUpdate = config.isApexPermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.apexClasses) : [];
        const pagePermissionsToUpdate = config.isPagePermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.apexPages) : [];
        const customAppPermissionsToUpdate = config.isCustomApplicationPermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.customApplications) : [];
        const customMDTToUpdate = config.isCustomMetadataPermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.customMetadataTypes) : [];
        const customPermPermissionsToUpdate = config.isCustomPermissionPermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.customPermissions) : [];
        const customSettingPermissionsToUpdate = config.isCustomSettingPermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.customSettings) : [];
        const customTabsPermissionsToUpdate = config.isCustomTabPermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.customTabs) : [];
        const userPermissionsToUpdate = config.isUserPermissions ? permsHelper.getAllGenericPermissionsToUpdate(config.userPermissions) : [];
        const externalDataSourceToUpdate = config.isExternalDataSource ? permsHelper.getAllGenericPermissionsToUpdate(config.externalDataSource) : [];

        const localProfilesInfo = utils.loadProfileFromPackageDirectories(projectPath, projectPackDir);
        const retreivedProfilesInfo = utils.loadProfileFromPackageDirectories(projectPath, undefined, [
            path.join(workingDirName, tempProjectDirName),
        ]);

        let profileCounter = 0;
        const totalProfiles = localProfilesInfo.length;
        for (const profileInfo of localProfilesInfo) {
            profileCounter++;
            ux.setSpinnerStatus(`${profileCounter} of ${totalProfiles}`);
            const correspondingRetreivedProfileInfo = retreivedProfilesInfo.find((pi) => JSON.stringify(pi.filename) === JSON.stringify(profileInfo.filename));
            if (!correspondingRetreivedProfileInfo) continue;

            let currentProfileJSON = await utils.readXml(profileInfo.path) as ParsedProfile;
            const retreivedProfileJSON = await utils.readXml(correspondingRetreivedProfileInfo.path) as ParsedProfile;

            if (config.isObjectPermissions) {
                currentProfileJSON = permsHelper.updateObjectPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    objectsPermissionsToUpdate
                );
            }

            if (config.isFieldPermissions) {
                currentProfileJSON = permsHelper.updateFieldPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    fieldsPermissionsToUpdate
                );
            }

            if (config.isRecordTypePermissions) {
                currentProfileJSON = permsHelper.updateRecordTypePermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    recordTypePermissionsToUpdate
                );
            }

            if (config.isLayoutAssignments) {
                currentProfileJSON = permsHelper.updateLayoutPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    layoutPermissionsToUpdate
                );
            }

            if (config.isApexPermissions) {
                currentProfileJSON = permsHelper.updateApexPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    apexPermissionsToUpdate
                );
            }

            if (config.isPagePermissions) {
                currentProfileJSON = permsHelper.updatePagePermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    pagePermissionsToUpdate
                );
            }

            if (config.isCustomApplicationPermissions) {
                currentProfileJSON = permsHelper.updateCustomAppPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    customAppPermissionsToUpdate
                );
            }

            if (config.isCustomMetadataPermissions) {
                currentProfileJSON = permsHelper.updateCustomMetadataPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    customMDTToUpdate
                );
            }

            if (config.isCustomPermissionPermissions) {
                currentProfileJSON = permsHelper.updateCustomPermPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    customPermPermissionsToUpdate
                );
            }

            if (config.isCustomSettingPermissions) {
                currentProfileJSON = permsHelper.updateCustomSettingPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    customSettingPermissionsToUpdate
                );
            }

            if (config.isCustomTabPermissions) {
                currentProfileJSON = permsHelper.updateCustomTabPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    customTabsPermissionsToUpdate
                );
            }

            if (config.isUserPermissions) {
                currentProfileJSON = permsHelper.updateUserPermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    userPermissionsToUpdate
                );
            }

            if (config.isExternalDataSource) {
                currentProfileJSON = permsHelper.updateExtDataSourcePermissions(
                    currentProfileJSON,
                    retreivedProfileJSON,
                    externalDataSourceToUpdate
                );
            }

            if (config.loginIpRanges) {
                currentProfileJSON = permsHelper.updateLoginIpRanges(
                    currentProfileJSON,
                    retreivedProfileJSON
                );
            }

            if (config.loginHours) {
                currentProfileJSON = permsHelper.updateLoginHours(
                    currentProfileJSON,
                    retreivedProfileJSON
                );
            }

            currentProfileJSON = utils.sortProfile(currentProfileJSON);

            await utils.writeXml(profileInfo.path, currentProfileJSON);
        }
        ux.stopSpinner('✔️\n');

        ux.styledHeader('Cleaning working directory');
        ux.startSpinner('Cleaning', 'In progress');
        try {
            await deleteDirRecursive(tempProjectPath);
            ux.stopSpinner('✔️\n');
        } catch {
            ux.stopSpinner('❌\n');
            throw new SfError(`An error occured during WorkingDirectory cleaning. Please delete this folder if you don't need it : ${tempProjectPath}`);
        }
        return;
    }
}
