import { ConfigType, GenericConfigType, ParsedProfile, ProfileCustom } from './typeDefs';


const updateFieldPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    fieldsPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentFieldPermissions = currentProfile.fieldPermissions;
    const allUpdatedFieldPermissions = updatedProfile.fieldPermissions;

    // removing existing fieldPermission for explicit fields
    allCurrentFieldPermissions =
        allCurrentFieldPermissions?.filter((fp) => !JSON.stringify(fieldsPermissionsToUpdate).includes(JSON.stringify(fp.field))) ?? [];

    // removing field permission for sObjects with allFields = true
    const allFieldSetForObj = fieldsPermissionsToUpdate.filter((field) => field[0].includes('*'));
    if (allFieldSetForObj && allFieldSetForObj.length > 0) {
        for (const allF of allFieldSetForObj) {
            allCurrentFieldPermissions = allCurrentFieldPermissions.filter((fp) => !fp.field[0].startsWith(allF[0].split('*')[0]));
        }
    }

    // add new FieldPermissions
    for (const field of fieldsPermissionsToUpdate) {
        if (field[0].includes('*')) {
            // adding field permissions for sObjects with allFields = true
            allCurrentFieldPermissions = allCurrentFieldPermissions.concat(
                allUpdatedFieldPermissions.filter((fp) => fp.field[0].startsWith(field[0].split('*')[0]))
            );
        } else {
            // adding field permissions for explicit fields
            const newFP = allUpdatedFieldPermissions.find((fp) => JSON.stringify(field) === JSON.stringify(fp.field));
            if (!newFP) continue;

            allCurrentFieldPermissions.push(newFP);
        }
    }
    currentProfile.fieldPermissions = allCurrentFieldPermissions;

    return currentProfileJson;
}

const updateObjectPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    objectsPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentObjectPermissions = currentProfile.objectPermissions;
    const allUpdatedObjectPermissions = updatedProfile.objectPermissions;

    // remove existing objectPermission
    allCurrentObjectPermissions =
        allCurrentObjectPermissions?.filter((op) => !JSON.stringify(objectsPermissionsToUpdate).includes(JSON.stringify(op.object))) ?? [];

    // add new ObjectPermissions
    for (const object of objectsPermissionsToUpdate) {
        const newOP = allUpdatedObjectPermissions?.find((op) => JSON.stringify(object) === JSON.stringify(op.object));
        if (!newOP) continue;

        allCurrentObjectPermissions.push(newOP);
    }
    currentProfile.objectPermissions = allCurrentObjectPermissions;

    return currentProfileJson;
}

const updateRecordTypePermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    recordTypePermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentRecordTypePermissions = currentProfile.recordTypeVisibilities;
    const allUpdatedRecordTypePermissions = updatedProfile.recordTypeVisibilities;

    // removing existing RecordTypeVisibilities for sObjects with retrieveRecordTypeVisibilities = true
    for (const objToUpdateRT of recordTypePermissionsToUpdate) {
        allCurrentRecordTypePermissions = allCurrentRecordTypePermissions?.filter((rtp) => !rtp.recordType[0].startsWith(`${objToUpdateRT[0]}.`)) ?? [];
    }

    // add new RecordType permissions
    for (const objToUpdateRT of recordTypePermissionsToUpdate) {
        // adding updated RecordTypeVisibilities
        allCurrentRecordTypePermissions = allCurrentRecordTypePermissions.concat(
            allUpdatedRecordTypePermissions?.filter((rtp) => rtp.recordType[0].startsWith(`${objToUpdateRT[0]}.`)) ?? []
        );
    }
    currentProfile.recordTypeVisibilities = allCurrentRecordTypePermissions;

    return currentProfileJson;
}

const updateLayoutPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    layoutPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentLayoutPermissions = currentProfile.layoutAssignments;
    const allUpdatedLayoutPermissions = updatedProfile.layoutAssignments;

    // removing existing LayoutAssignments for sObjects with retrieveLayoutAssignations = true
    for (const objToUpdateLA of layoutPermissionsToUpdate) {
        allCurrentLayoutPermissions = allCurrentLayoutPermissions?.filter((lp) => !lp.layout[0].startsWith(objToUpdateLA[0])) ?? [];
    }

    // add new LayoutAssignments
    for (const objToUpdateLA of layoutPermissionsToUpdate) {
        // adding updated LayoutAssignments
        allCurrentLayoutPermissions = allCurrentLayoutPermissions.concat(
            allUpdatedLayoutPermissions?.filter((lp) => lp.layout[0].startsWith(objToUpdateLA[0])) ?? []
        );
    }
    currentProfile.layoutAssignments = allCurrentLayoutPermissions;

    return currentProfileJson;
}

const updateApexPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    apexPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentApexPermissions = currentProfile.classAccesses;
    const allUpdatedApexPermissions = updatedProfile.classAccesses;

    if (JSON.stringify(apexPermissionsToUpdate) === JSON.stringify([['*']])) {
        allCurrentApexPermissions = allUpdatedApexPermissions;
        currentProfile.classAccesses = allCurrentApexPermissions;
        return currentProfileJson;
    }

    // remove existing apexPermission
    allCurrentApexPermissions =
        allCurrentApexPermissions?.filter((ap) => !JSON.stringify(apexPermissionsToUpdate).includes(JSON.stringify(ap.apexClass))) ?? [];

    // add new ObjectPermissions
    for (const apexPermission of apexPermissionsToUpdate) {
        const newAP = allUpdatedApexPermissions?.find((ap) => JSON.stringify(apexPermission) === JSON.stringify(ap.apexClass));
        if (!newAP) continue;

        allCurrentApexPermissions.push(newAP);
    }
    currentProfile.classAccesses = allCurrentApexPermissions;

    return currentProfileJson;
}

const updatePagePermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    pagePermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentPagePermissions = currentProfile.pageAccesses;
    const allUpdatedPagePermissions = updatedProfile.pageAccesses;

    if (JSON.stringify(pagePermissionsToUpdate) === JSON.stringify([['*']])) {
        allCurrentPagePermissions = allUpdatedPagePermissions;
        currentProfile.pageAccesses = allCurrentPagePermissions;
        return currentProfileJson;
    }

    // remove existing apexPermission
    allCurrentPagePermissions =
        allCurrentPagePermissions?.filter((pp) => !JSON.stringify(pagePermissionsToUpdate).includes(JSON.stringify(pp.apexPage))) ?? [];

    // add new ObjectPermissions
    for (const pagePermission of pagePermissionsToUpdate) {
        const newPP = allUpdatedPagePermissions?.find((pp) => JSON.stringify(pagePermission) === JSON.stringify(pp.apexPage));
        if (!newPP) continue;

        allCurrentPagePermissions.push(newPP);
    }
    currentProfile.pageAccesses = allCurrentPagePermissions;

    return currentProfileJson;
}

const updateCustomAppPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    customAppPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentCustomAppPermissions = currentProfile.applicationVisibilities;
    const allUpdatedCustomAppPermissions = updatedProfile.applicationVisibilities;

    if (JSON.stringify(customAppPermissionsToUpdate) === JSON.stringify([['*']])) {
        allCurrentCustomAppPermissions = allUpdatedCustomAppPermissions;
        currentProfile.applicationVisibilities = allCurrentCustomAppPermissions;
        return currentProfileJson;
    }

    // remove existing applicationVisibilities
    allCurrentCustomAppPermissions =
        allCurrentCustomAppPermissions?.filter((ap) => !JSON.stringify(customAppPermissionsToUpdate).includes(JSON.stringify(ap.application))) ?? [];

    // add new applicationVisibilities
    for (const customAppPermission of customAppPermissionsToUpdate) {
        const newAP = allUpdatedCustomAppPermissions?.find((ap) => JSON.stringify(customAppPermission) === JSON.stringify(ap.application));
        if (!newAP) continue;

        allCurrentCustomAppPermissions.push(newAP);
    }
    currentProfile.applicationVisibilities = allCurrentCustomAppPermissions;

    return currentProfileJson;
}

const updateCustomMetadataPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    customMDTToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentMDTPermissions = currentProfile.customMetadataTypeAccesses;
    const allUpdatedMDTPermissions = updatedProfile.customMetadataTypeAccesses;

    if (JSON.stringify(customMDTToUpdate) === JSON.stringify([['*']])) {
        allCurrentMDTPermissions = allUpdatedMDTPermissions;
        currentProfile.customMetadataTypeAccesses = allCurrentMDTPermissions;
        return currentProfileJson;
    }

    // remove existing customMetadataTypeAccesses
    allCurrentMDTPermissions =
        allCurrentMDTPermissions?.filter((mdtp) => !JSON.stringify(customMDTToUpdate).includes(JSON.stringify(mdtp.name))) ?? [];

    // add new customMetadataTypeAccesses
    for (const cmd of customMDTToUpdate) {
        const newCMDP = allUpdatedMDTPermissions?.find((mdtp) => JSON.stringify(cmd) === JSON.stringify(mdtp.name));
        if (!newCMDP) continue;

        allCurrentMDTPermissions.push(newCMDP);
    }
    currentProfile.customMetadataTypeAccesses = allCurrentMDTPermissions;

    return currentProfileJson;
}

const updateCustomPermPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    customPermPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentCustomPermPermissions = currentProfile.customPermissions;
    const allUpdatedCustomPermPermissions = updatedProfile.customPermissions;

    if (JSON.stringify(customPermPermissionsToUpdate) === JSON.stringify([['*']])) {
        allCurrentCustomPermPermissions = allUpdatedCustomPermPermissions;
        currentProfile.customPermissions = allCurrentCustomPermPermissions;
        return currentProfileJson;
    }

    // remove existing customPermissions
    allCurrentCustomPermPermissions =
        allCurrentCustomPermPermissions?.filter((cpp) => !JSON.stringify(customPermPermissionsToUpdate).includes(JSON.stringify(cpp.name))) ?? [];

    // add new customPermissions
    for (const customPermPermission of customPermPermissionsToUpdate) {
        const newCPP = allUpdatedCustomPermPermissions?.find((cpp) => JSON.stringify(customPermPermission) === JSON.stringify(cpp.name));
        if (!newCPP) continue;

        allCurrentCustomPermPermissions.push(newCPP);
    }
    currentProfile.customPermissions = allCurrentCustomPermPermissions;

    return currentProfileJson;
}

const updateCustomSettingPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    customSettingPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentCustomSettingPermissions = currentProfile.customSettingAccesses;
    const allUpdatedCustomSettingPermissions = updatedProfile.customSettingAccesses;

    if (JSON.stringify(customSettingPermissionsToUpdate) === JSON.stringify([['*']])) {
        allCurrentCustomSettingPermissions = allUpdatedCustomSettingPermissions;
        currentProfile.customSettingAccesses = allCurrentCustomSettingPermissions;
        return currentProfileJson;
    }

    // remove existing customSettingAccesses
    allCurrentCustomSettingPermissions =
        allCurrentCustomSettingPermissions?.filter((csp) => !JSON.stringify(customSettingPermissionsToUpdate).includes(JSON.stringify(csp.name))) ?? [];

    // add new customSettingAccesses
    for (const customSettingPermission of customSettingPermissionsToUpdate) {
        const newCSP = allUpdatedCustomSettingPermissions?.find((csp) => JSON.stringify(customSettingPermission) === JSON.stringify(csp.name));
        if (!newCSP) continue;

        allCurrentCustomSettingPermissions.push(newCSP);
    }
    currentProfile.customSettingAccesses = allCurrentCustomSettingPermissions;

    return currentProfileJson;
}

const updateCustomTabPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    customTabsPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentCustomTabPermissions = currentProfile.tabVisibilities;
    const allUpdatedCustomTabPermissions = updatedProfile.tabVisibilities;

    if (JSON.stringify(customTabsPermissionsToUpdate) === JSON.stringify([['*']])) {
        allCurrentCustomTabPermissions = allUpdatedCustomTabPermissions;
        currentProfile.tabVisibilities = allCurrentCustomTabPermissions;
        return currentProfileJson;
    }

    // remove existing tabVisibilities
    allCurrentCustomTabPermissions =
        allCurrentCustomTabPermissions?.filter((ctp) => !JSON.stringify(customTabsPermissionsToUpdate).includes(JSON.stringify(ctp.tab))) ?? [];

    // add new tabVisibilities
    for (const customTabPermission of customTabsPermissionsToUpdate) {
        const newCTP = allUpdatedCustomTabPermissions?.find((ctp) => JSON.stringify(customTabPermission) === JSON.stringify(ctp.tab));
        if (!newCTP) continue;

        allCurrentCustomTabPermissions.push(newCTP);
    }
    currentProfile.tabVisibilities = allCurrentCustomTabPermissions;

    return currentProfileJson;
}

const updateUserPermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    userPermissionsToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentUserPermPermissions = currentProfile.userPermissions;
    const allUpdatedUserPermPermissions = updatedProfile.userPermissions;

    if (JSON.stringify(userPermissionsToUpdate) === JSON.stringify([['*']])) {
        allCurrentUserPermPermissions = allUpdatedUserPermPermissions;
        currentProfile.userPermissions = allCurrentUserPermPermissions;
        return currentProfileJson;
    }

    // remove existing userPermissions
    allCurrentUserPermPermissions =
        allCurrentUserPermPermissions?.filter((up) => !JSON.stringify(userPermissionsToUpdate).includes(JSON.stringify(up.name))) ?? [];

    // add new userPermissions
    for (const userPermPermission of userPermissionsToUpdate) {
        const newUP = allUpdatedUserPermPermissions?.find((up) => JSON.stringify(userPermPermission) === JSON.stringify(up.name));
        if (!newUP) continue;

        allCurrentUserPermPermissions.push(newUP);
    }
    currentProfile.userPermissions = allCurrentUserPermPermissions;

    return currentProfileJson;
}

const updateExtDataSourcePermissions = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile,
    externalDataSourceToUpdate: string[][]
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    let allCurrentExtDataSourcePermissions = currentProfile.externalDataSourceAccesses;
    const allUpdatedExtDataSourcePermissions = updatedProfile.externalDataSourceAccesses;

    if (JSON.stringify(externalDataSourceToUpdate) === JSON.stringify([['*']])) {
        allCurrentExtDataSourcePermissions = allUpdatedExtDataSourcePermissions;
        currentProfile.externalDataSourceAccesses = allCurrentExtDataSourcePermissions;
        return currentProfileJson;
    }

    // remove existing userPermissions
    allCurrentExtDataSourcePermissions =
        allCurrentExtDataSourcePermissions?.filter((edsp) => !JSON.stringify(externalDataSourceToUpdate).includes(JSON.stringify(edsp.externalDataSource))) ?? [];

    // add new userPermissions
    for (const extDataSourcePermission of externalDataSourceToUpdate) {
        const newEDSP = allUpdatedExtDataSourcePermissions?.find((edsp) => JSON.stringify(extDataSourcePermission) === JSON.stringify(edsp.externalDataSource));
        if (!newEDSP) continue;

        allCurrentExtDataSourcePermissions.push(newEDSP);
    }
    currentProfile.externalDataSourceAccesses = allCurrentExtDataSourcePermissions;

    return currentProfileJson;
}

const updateLoginIpRanges = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    currentProfile.loginIpRanges = updatedProfile.loginIpRanges;
    if (!currentProfile.loginIpRanges || currentProfile.loginIpRanges.length === 0) {
        delete currentProfile.loginIpRanges;
    }
    return currentProfileJson;
}

const updateLoginHours = function (
    currentProfileJson: ParsedProfile,
    updatedProfileJson: ParsedProfile
): ParsedProfile {
    if (!currentProfileJson || !Object.prototype.hasOwnProperty.call(currentProfileJson, 'Profile')) {
        return;
    }
    if (!updatedProfileJson || !Object.prototype.hasOwnProperty.call(updatedProfileJson, 'Profile')) {
        return currentProfileJson;
    }

    const currentProfile: ProfileCustom = currentProfileJson.Profile;
    const updatedProfile: ProfileCustom = updatedProfileJson.Profile;

    currentProfile.loginHours = updatedProfile.loginHours;
    if (!currentProfile.loginHours) {
        delete currentProfile.loginHours;
    }
    return currentProfileJson;
}

const getAllObjectPermissionsToUpdate = function (config: ConfigType): string[][] {
    const ret: string[][] = [];

    config.sObjects.forEach((sObj) => {
        if (sObj.retrieveObjectPermissions) {
            ret.push([sObj.apiName.trim()]);
        }
    });
    return removeDuplicatesFromArray(ret);
}

const getAllFieldsPermissionsToUpdate = function (config: ConfigType): string[][] {
    const ret: string[][] = [];

    config.sObjects.forEach((sObj) => {
        if (sObj.allFieldsPermissions) {
            ret.push([`${sObj.apiName}.*`]);
        } else if (sObj.fieldsPermissionsFor) {
            sObj.fieldsPermissionsFor?.forEach((field) => {
                ret.push([`${sObj.apiName.trim()}.${field.trim()}`]);
            });
        }
    });
    return removeDuplicatesFromArray(ret);
}

const getAllRecordTypePermissionsToUpdate = function (config: ConfigType): string[][] {
    const ret: string[][] = [];

    config.sObjects.forEach((sObj) => {
        if (sObj.retrieveRecordTypeVisibilities) {
            ret.push([sObj.apiName.trim()]);
        }
    });
    return removeDuplicatesFromArray(ret);
}

const getAllLayoutPermissionsToUpdate = function (config: ConfigType): string[][] {
    const ret: string[][] = [];

    config.sObjects.forEach((sObj) => {
        if (sObj.retrieveLayoutAssignments) {
            ret.push([sObj.apiName.trim() + '-']);
        }
    });
    return removeDuplicatesFromArray(ret);
}

const getAllGenericPermissionsToUpdate = function (genericConfig: GenericConfigType): string[][] {
    const ret: string[][] = [];

    if (genericConfig.allPermissions) {
        ret.push(['*']);
        return ret;
    }

    genericConfig.permissionsFor.forEach((element) => {
        ret.push([element.trim()]);
    });
    return removeDuplicatesFromArray(ret);
}

// Private method
const removeDuplicatesFromArray = function (array: string[][]): string[][] {
    // convert string[][] to string[] because we know that all elements are size 1
    let strArr = array.map((elArr) => elArr[0]);
    // delete duplicates values using Set<string>
    strArr = [...new Set(strArr)];
    // rebuild string[][] array
    array = strArr.map((strEl) => [strEl]);

    return array;
}

export {
    updateFieldPermissions,
    updateObjectPermissions,
    updateRecordTypePermissions,
    updateLayoutPermissions,
    updateApexPermissions,
    updatePagePermissions,
    updateCustomAppPermissions,
    updateCustomMetadataPermissions,
    updateCustomPermPermissions,
    updateCustomSettingPermissions,
    updateCustomTabPermissions,
    updateUserPermissions,
    updateExtDataSourcePermissions,
    updateLoginIpRanges,
    updateLoginHours,
    getAllObjectPermissionsToUpdate,
    getAllFieldsPermissionsToUpdate,
    getAllRecordTypePermissionsToUpdate,
    getAllLayoutPermissionsToUpdate,
    getAllGenericPermissionsToUpdate
}