/* eslint-disable no-await-in-loop */
import * as path from 'path';
import { SfError } from '@salesforce/core';
import { Progress, Spinner } from '@salesforce/sf-plugins-core';
import * as utils from './utils';
import * as permsHelper from './permissionsHelper';
import { profileConfigFileName, manifestFileName, tempProjectDirName, workingDirName } from './constants';
import { checkWorkingDir, deleteDirRecursive } from './dirManagment';
import { ParsedProfile, ProfileCustom, UpdaterOptionsType } from './typeDefs';

export class ProfileUpdater {
    // eslint-disable-next-line complexity
    public static async doUpdate(options: UpdaterOptionsType): Promise<void> {

        let configPath = options.configPath;
        const orgUsername = options.orgUsername;
        const projectPath = options.projectPath;
        const projectPackDir = options.projectPackDir;
        const apiVersion = options.apiVersion;
        const tempProjectPath = path.join(projectPath, workingDirName, tempProjectDirName);

        if (!configPath) {
            configPath = path.join(projectPath, workingDirName, profileConfigFileName);
        }
        const config = await utils.getProfileConfig(configPath);
        if (!config) {
            return;
        }

        options.rootClass.styledHeader('Generating Manifest File');
        options.rootClass.spinner = new Spinner(true);
        options.rootClass.spinner.start('Generating Manifest', 'In progress');

        const workingDirPath = await checkWorkingDir(projectPath);

        const manifestPath = await utils.generateProfileManifest(
            options,
            config,
            apiVersion,
            workingDirPath,
            manifestFileName
        );
        options.rootClass.spinner.stop('✔️\n');

        options.rootClass.styledHeader(`Retreiving Metadata from Salesforce Org using : ${orgUsername}`);
        await utils.retreiveFromManifest(manifestPath, tempProjectPath, orgUsername, options.rootClass, 'permissions');

        options.rootClass.styledHeader('Updating local profiles');
        options.rootClass.spinner = new Spinner(true);
        options.rootClass.spinner.start('Initializing Update', 'In progress');

        const localProfilesInfo = utils.loadProfileFromPackageDirectories(projectPath, projectPackDir);
        const retreivedProfilesInfo = utils.loadProfileFromPackageDirectories(projectPath, undefined, [
            path.join(workingDirName, tempProjectDirName),
        ]);

        options.rootClass.spinner.stop('✔️\n');

        options.rootClass.log('Updating local profiles :')
        let profileCounter = 0;
        const totalProfiles = localProfilesInfo.length;
        options.rootClass.progress = new Progress(true);
        options.rootClass.progress.start(totalProfiles);
        for (const profileInfo of localProfilesInfo) {
            profileCounter++;
            options.rootClass.progress.update(profileCounter);

            const correspondingRetreivedProfileInfo = retreivedProfilesInfo.find((pi) => JSON.stringify(pi.filename) === JSON.stringify(profileInfo.filename));
            if (!correspondingRetreivedProfileInfo) continue;

            let currentProfileJSON = await utils.readXml(profileInfo.path) as ParsedProfile;
            const retreivedProfileJSON = await utils.readXml(correspondingRetreivedProfileInfo.path) as ParsedProfile;

            if (!currentProfileJSON || !Object.prototype.hasOwnProperty.call(currentProfileJSON, 'Profile')) {
                continue;
            }
            if (!retreivedProfileJSON || !Object.prototype.hasOwnProperty.call(retreivedProfileJSON, 'Profile')) {
                continue;
            }

            let currentProfile: ProfileCustom = currentProfileJSON.Profile;
            const updatedProfile: ProfileCustom = retreivedProfileJSON.Profile;

            if (config.isObjectPermissions) {
                const objectsPermissionsToUpdate = permsHelper.getAllObjectPermissionsToUpdate(config);
                currentProfile = permsHelper.updateObjectPermissions(
                    currentProfile,
                    updatedProfile,
                    objectsPermissionsToUpdate
                );
            }

            if (config.isFieldPermissions) {
                const fieldsPermissionsToUpdate = permsHelper.getAllFieldsPermissionsToUpdate(config);
                currentProfile = permsHelper.updateFieldPermissions(
                    currentProfile,
                    updatedProfile,
                    fieldsPermissionsToUpdate
                );
            }

            if (config.isRecordTypePermissions) {
                const recordTypePermissionsToUpdate = permsHelper.getAllRecordTypePermissionsToUpdate(config);
                currentProfile = permsHelper.updateRecordTypePermissions(
                    currentProfile,
                    updatedProfile,
                    recordTypePermissionsToUpdate
                );
            }

            if (config.isLayoutAssignments) {
                const layoutPermissionsToUpdate = permsHelper.getAllLayoutPermissionsToUpdate(config);
                currentProfile = permsHelper.updateLayoutPermissions(
                    currentProfile,
                    updatedProfile,
                    layoutPermissionsToUpdate
                );
            }

            if (config.isApexPermissions) {
                const apexPermissionsToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.apexClasses, 'apex');
                currentProfile = permsHelper.updateApexPermissions(
                    currentProfile,
                    updatedProfile,
                    apexPermissionsToUpdate
                );
            }

            if (config.isPagePermissions) {
                const pagePermissionsToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.apexPages, 'page');
                currentProfile = permsHelper.updatePagePermissions(
                    currentProfile,
                    updatedProfile,
                    pagePermissionsToUpdate
                );
            }

            if (config.isCustomApplicationPermissions) {
                const customAppPermissionsToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.customApplications, 'custApp');
                currentProfile = permsHelper.updateCustomAppPermissions(
                    currentProfile,
                    updatedProfile,
                    customAppPermissionsToUpdate
                );
            }

            if (config.isCustomMetadataPermissions) {
                const customMDTToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.customMetadataTypes, 'custMetadata');
                currentProfile = permsHelper.updateCustomMetadataPermissions(
                    currentProfile,
                    updatedProfile,
                    customMDTToUpdate
                );
            }

            if (config.isCustomPermissionPermissions) {
                const customPermPermissionsToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.customPermissions, 'custPerm');
                currentProfile = permsHelper.updateCustomPermPermissions(
                    currentProfile,
                    updatedProfile,
                    customPermPermissionsToUpdate
                );
            }

            if (config.isCustomSettingPermissions) {
                const customSettingPermissionsToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.customSettings, 'custSet');
                currentProfile = permsHelper.updateCustomSettingPermissions(
                    currentProfile,
                    updatedProfile,
                    customSettingPermissionsToUpdate
                );
            }

            if (config.isCustomTabPermissions) {
                const customTabsPermissionsToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.customTabs, 'custTab');
                currentProfile = permsHelper.updateCustomTabPermissions(
                    currentProfile,
                    updatedProfile,
                    customTabsPermissionsToUpdate
                );
            }

            if (config.isUserPermissions) {
                const userPermissionsToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.userPermissions, 'userPerm');
                currentProfile = permsHelper.updateUserPermissions(
                    currentProfile,
                    updatedProfile,
                    userPermissionsToUpdate
                );
            }

            if (config.isExternalDataSource) {
                const externalDataSourceToUpdate = permsHelper.getAllGenericPermissionsToUpdate(config.externalDataSource, 'extSource');
                currentProfile = permsHelper.updateExtDataSourcePermissions(
                    currentProfile,
                    updatedProfile,
                    externalDataSourceToUpdate
                );
            }

            if (config.loginIpRanges) {
                currentProfile = permsHelper.updateLoginIpRanges(
                    currentProfile,
                    updatedProfile
                );
            }

            if (config.loginHours) {
                currentProfile = permsHelper.updateLoginHours(
                    currentProfile,
                    updatedProfile
                );
            }

            currentProfileJSON = utils.sortProfile(currentProfileJSON);

            await utils.writeXml(profileInfo.path, currentProfileJSON);
        }
        options.rootClass.progress.finish();
        options.rootClass.log('Local profiles successfully updated ! ✔️\n');

        options.rootClass.styledHeader('Cleaning working directory');
        options.rootClass.spinner = new Spinner(true);
        options.rootClass.spinner.start('Cleaning', 'In progress');
        try {
            await deleteDirRecursive(tempProjectPath);
            options.rootClass.spinner.stop('✔️\n');
        } catch {
            options.rootClass.spinner.stop('❌\n');
            throw new SfError(`An error occured during WorkingDirectory cleaning. Please delete this folder if you don't need it : ${tempProjectPath}`);
        }
        return;
    }
}
