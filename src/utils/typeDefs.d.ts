import { Connection, NamedPackageDir } from '@salesforce/core';
import {
    Profile,
    ProfileActionOverride,
    ProfileApexClassAccess,
    ProfileApexPageAccess,
    ProfileApplicationVisibility,
    ProfileCategoryGroupVisibility,
    ProfileCustomMetadataTypeAccess,
    ProfileCustomPermissions,
    ProfileExternalDataSourceAccess,
    ProfileFieldLevelSecurity,
    ProfileFlowAccess,
    ProfileLayoutAssignment,
    ProfileLoginHours,
    ProfileLoginIpRange,
    ProfileObjectPermissions,
    ProfilePasswordPolicy,
    ProfileRecordTypeVisibility,
    ProfileSearchLayouts,
    ProfileSessionSetting,
    ProfileTabVisibility,
    ProfileUserPermission
} from 'jsforce/lib/api/metadata';

export type ProfileItem =
    | ProfileActionOverride
    | ProfileApexClassAccess
    | ProfileApexPageAccess
    | ProfileApplicationVisibility
    | ProfileCategoryGroupVisibility
    | ProfileCustomMetadataTypeAccess
    | ProfileCustomPermissions
    | ProfileExternalDataSourceAccess
    | ProfileFieldLevelSecurity
    | ProfileFlowAccess
    | ProfileLayoutAssignment
    | ProfileLoginHours
    | ProfileLoginIpRange
    | ProfileObjectPermissions
    | ProfilePasswordPolicy
    | ProfileRecordTypeVisibility
    | ProfileSearchLayouts
    | ProfileSessionSetting
    | ProfileTabVisibility
    | ProfileUserPermission;

export type TypeMembersType = {
    _: string;
}

export type PackageTypesType = {
    members: TypeMembersType[];
    name: string;
}

export type PackageType = {
    $: {
        xmlns: 'http://soap.sforce.com/2006/04/metadata';
    };
    types: PackageTypesType[];
    version: string;
}

export type ManifestType = Record<string, unknown> & {
    Package: PackageType;
}

export type sObjectConfigType = {
    apiName: string;
    retrieveObjectPermissions?: boolean;
    fieldsPermissionsFor?: string[];
    allFieldsPermissions?: boolean;
    retrieveRecordTypeVisibilities?: boolean;
    retrieveLayoutAssignments?: boolean;
}

export type GenericConfigType = {
    allPermissions?: boolean;
    permissionsFor?: string[];
}

export type ConfigType = {
    sObjects?: sObjectConfigType[];
    apexClasses?: GenericConfigType;
    apexPages?: GenericConfigType;
    customApplications?: GenericConfigType;
    customMetadataTypes?: GenericConfigType;
    customPermissions?: GenericConfigType;
    customSettings?: GenericConfigType;
    loginIpRanges?: boolean;
    loginHours?: boolean;
    customTabs?: GenericConfigType;
    userPermissions?: GenericConfigType;
    externalDataSource?: GenericConfigType;
    isObjectPermissions: boolean;
    isFieldPermissions: boolean;
    isRecordTypePermissions: boolean;
    isLayoutAssignments: boolean;
    isApexPermissions: boolean;
    isPagePermissions: boolean;
    isCustomApplicationPermissions: boolean;
    isCustomMetadataPermissions: boolean;
    isCustomPermissionPermissions: boolean;
    isCustomSettingPermissions: boolean;
    isCustomTabPermissions: boolean;
    isUserPermissions: boolean;
    isExternalDataSource: boolean;
}

export type ProfileUpdaterOptionsType = {
    configPath: string;
    orgUsername: string;
    projectPath: string;
    projectPackDir: NamedPackageDir[];
    apiVersion: string;
    connection: Connection;
}

export type ProfileInfoType = {
    profilename: string;
    filename: string;
    path: string;
}

export type ParsedProfile = {
    Profile: ProfileCustom;
}

export type ProfileCustom = Profile & {
    customSettingAccesses: ProfileCustomSettingAccesses[];
}

export type ProfileCustomSettingAccesses = {
    enabled: boolean;
    name: string;
}

export type CustomTabLightType = {
    name: string;
    sobjectName: string;
};
