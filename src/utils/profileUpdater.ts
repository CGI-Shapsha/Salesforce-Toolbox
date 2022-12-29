import * as path from 'path';
import { NamedPackageDir } from '@salesforce/core';
import { UX } from '@salesforce/command';
import * as utils from './utils';
import { configFileName, manifestFileName, tempProjectDirName, workingDirName } from './constants';
import { checkWorkingDir, deleteDirRecursive } from './dirManagment';

export class ProfileUpdater {
    public static async doUpdate(options: {
        configPath: string;
        orgUsername: string;
        projectPath: string;
        projectPackDir: NamedPackageDir[];
        apiVersion: string;
    }): Promise<void> {
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
        const manifestPath = await utils.generateManifest(config, apiVersion, workingDirPath, manifestFileName);
        ux.log('Manifest generated.');

        ux.styledHeader(`Retreiving Metadata from Salesforce Org using : ${orgUsername}`);
        await utils.retreiveFromManifest(manifestPath, tempProjectPath, orgUsername);

        ux.styledHeader('Updating local profiles');
        const fieldsToUpdatePermissions = utils.getAllFieldsPermissionsToUpdate(config);
        const objectsToUpdatePermissions = utils.getAllObjectPermissionsToUpdate(config);
        const localProfilesInfo = utils.loadProfileFromPackageDirectories(projectPath, projectPackDir);
        const retreivedProfilesInfo = utils.loadProfileFromPackageDirectories(projectPath, undefined, [
            `${workingDirName}/${tempProjectDirName}`,
        ]);

        ux.startSpinner('Updating profiles', 'Initializing');
        let profileCounter = 0;
        const totalProfiles = localProfilesInfo.length;
        for (const profileInfo of localProfilesInfo) {
            profileCounter++;
            ux.setSpinnerStatus(`${profileCounter} of ${totalProfiles}`);
            const correspondingRetreivedProfileInfo = retreivedProfilesInfo.find((pi) => {
                return JSON.stringify(pi.filename) === JSON.stringify(profileInfo.filename);
            });
            if (!correspondingRetreivedProfileInfo) continue;

            let currentProfileJSON = await utils.readXml(profileInfo.path);
            const retreivedProfileJSON = await utils.readXml(correspondingRetreivedProfileInfo.path);

            currentProfileJSON = utils.updatePermissions(
                currentProfileJSON,
                retreivedProfileJSON,
                fieldsToUpdatePermissions,
                objectsToUpdatePermissions
            );
            currentProfileJSON = utils.sortProfile(currentProfileJSON);

            await utils.writeXml(profileInfo.path, currentProfileJSON);
        }
        ux.stopSpinner('✔️');

        await deleteDirRecursive(tempProjectPath);
        return;
    }
}
