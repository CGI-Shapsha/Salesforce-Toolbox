export type FormFactor = 'Small' | 'Medium' | 'Large';
export type ActionOverrideType = 'Default' | 'Standard' | 'Scontrol' | 'Visualforce' | 'Flexipage' | 'LightningComponent';
export type CategoryGroupVisibility = 'ALL' | 'NONE' | 'CUSTOM';
export type SessionSecurityLevel = 'LOW' | 'STANDARD' | 'HIGH_ASSURANCE';
export type TabVisibility = 'Hidden' | 'DefaultOff' | 'DefaultOn';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ManifestType = Record<string, unknown> & {
    Package: PackageType;
}

export type sObjectConfigType = {
    apiName: string;
    retrieveObjectPermissions?: boolean;
    fields?: string[];
    allFields?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ConfigType = {
    sObjects: sObjectConfigType[];
}

export type Metadata = {
    fullName?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ProfileInfoType = {
    profilename: string;
    filename: string;
    path: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Profile = Metadata & {
    applicationVisibilities?: ProfileApplicationVisibility[];
    categoryGroupVisibilities?: ProfileCategoryGroupVisibility[];
    classAccesses?: ProfileApexClassAccess[];
    custom?: boolean[];
    customMetadataTypeAccesses?: ProfileCustomMetadataTypeAccess[];
    customPermissions?: ProfileCustomPermissions[];
    description?: string[];
    externalDataSourceAccesses?: ProfileExternalDataSourceAccess[];
    fieldPermissions?: ProfileFieldLevelSecurity[];
    flowAccesses?: ProfileFlowAccess[];
    layoutAssignments?: ProfileLayoutAssignment[];
    loginHours?: ProfileLoginHours[];
    loginIpRanges?: ProfileLoginIpRange[];
    objectPermissions?: ProfileObjectPermissions[];
    pageAccesses?: ProfileApexPageAccess[];
    profileActionOverrides?: ProfileActionOverride[];
    recordTypeVisibilities?: ProfileRecordTypeVisibility[];
    tabVisibilities?: ProfileTabVisibility[];
    userLicense?: string[];
    userPermissions?: ProfileUserPermission[];
}

export type ProfileActionOverride = {
    actionName?: string[];
    content?: string[];
    formFactor?: FormFactor[];
    pageOrSobjectType?: string[];
    recordType?: string[];
    type?: ActionOverrideType[];
}
export type ProfileApexClassAccess = {
    apexClass?: string[];
    enabled?: boolean[];
}
export type ProfileApexPageAccess = {
    apexPage?: string[];
    enabled?: boolean[];
}
export type ProfileApplicationVisibility = {
    application?: string[];
    default?: boolean[];
    visible?: boolean[];
}
export type ProfileCategoryGroupVisibility = {
    dataCategories?: string[];
    dataCategoryGroup?: string[];
    visibility?: CategoryGroupVisibility[];
}
export type ProfileCustomMetadataTypeAccess = {
    enabled?: boolean[];
    name?: string[];
}
export type ProfileCustomPermissions = {
    enabled?: boolean[];
    name?: string[];
}
export type ProfileExternalDataSourceAccess = {
    enabled?: boolean[];
    externalDataSource?: string[];
}
export type ProfileFieldLevelSecurity = {
    editable?: boolean[];
    field?: string[];
    readable?: boolean[];
}
export type ProfileFlowAccess = {
    enabled?: boolean[];
    flow?: string[];
}
export type ProfileLayoutAssignment = {
    layout?: string[];
    recordType?: string[];
}
export type ProfileLoginHours = {
    fridayEnd?: string[];
    fridayStart?: string[];
    mondayEnd?: string[];
    mondayStart?: string[];
    saturdayEnd?: string[];
    saturdayStart?: string[];
    sundayEnd?: string[];
    sundayStart?: string[];
    thursdayEnd?: string[];
    thursdayStart?: string[];
    tuesdayEnd?: string[];
    tuesdayStart?: string[];
    wednesdayEnd?: string[];
    wednesdayStart?: string[];
}
export type ProfileLoginIpRange = {
    description?: string[];
    endAddress?: string[];
    startAddress?: string[];
}
export type ProfileObjectPermissions = {
    allowCreate?: boolean[];
    allowDelete?: boolean[];
    allowEdit?: boolean[];
    allowRead?: boolean[];
    modifyAllRecords?: boolean[];
    object?: string[];
    viewAllRecords?: boolean[];
}
export type ProfilePasswordPolicy = Metadata & {
    forgotPasswordRedirect?: boolean[];
    lockoutInterval?: number[];
    maxLoginAttempts?: number[];
    minimumPasswordLength?: number[];
    minimumPasswordLifetime?: boolean[];
    obscure?: boolean[];
    passwordComplexity?: number[];
    passwordExpiration?: number[];
    passwordHistory?: number[];
    passwordQuestion?: number[];
    profile?: string[];
}
export type ProfileRecordTypeVisibility = {
    default?: boolean[];
    personAccountDefault?: boolean[];
    recordType?: string[];
    visible?: boolean[];
}
export type ProfileSearchLayouts = {
    fields?: string[];
    profileName?: string[];
}
export type ProfileSessionSetting = Metadata & {
    externalCommunityUserIdentityVerif?: boolean[];
    forceLogout?: boolean[];
    profile?: string[];
    requiredSessionLevel?: SessionSecurityLevel[];
    sessionPersistence?: boolean[];
    sessionTimeout?: number[];
    sessionTimeoutWarning?: boolean[];
}
export type ProfileTabVisibility = {
    tab?: string[];
    visibility?: TabVisibility[];
}
export type ProfileUserPermission = {
    enabled?: boolean[];
    name?: string[];
}
