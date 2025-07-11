/**
 * @description Custom Type definitions
 * @author Philippe Planchon <planchon.phil@gmail.com>
 */
import { NamedPackageDir, Connection } from '@salesforce/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
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
  ProfileUserPermission,
  CustomObjectTranslation,
  Translations,
  ObjectNameCaseValue,
  FieldSetTranslation,
  CustomFieldTranslation,
  LayoutTranslation,
  QuickActionTranslation,
  RecordTypeTranslation,
  SharingReasonTranslation,
  StandardFieldTranslation,
  ValidationRuleTranslation,
  WebLinkTranslation,
  WorkflowTaskTranslation,
  CustomApplicationTranslation,
  CustomLabelTranslation,
  FlowDefinitionTranslation,
  GlobalQuickActionTranslation,
  ReportTypeTranslation,
} from '@jsforce/jsforce-node/lib/api/metadata.js';

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
};

export type PackageTypesType = {
  members: TypeMembersType[];
  name: string;
};

export type PackageType = {
  $: {
    xmlns: 'http://soap.sforce.com/2006/04/metadata';
  };
  types: PackageTypesType[];
  version: string;
};

export type ManifestType = Record<string, unknown> & {
  Package: PackageType;
};

export type sObjectPermConfigType = {
  apiName: string;
  retrieveObjectPermissions?: boolean;
  fields?: GenericPermConfigType;
  retrieveRecordTypeVisibilities?: boolean;
  retrieveLayoutAssignments?: boolean;
};

export type sObjectTransConfigType = {
  apiName: string;
  retrieveObjectRenameTranslations?: boolean;
  fields?: GenericTransConfigType;
  layouts?: GenericTransConfigType;
  fieldSets?: GenericTransConfigType;
  quickActions?: GenericTransConfigType;
  recordTypes?: GenericTransConfigType;
  sharingReasons?: GenericTransConfigType;
  validationRules?: GenericTransConfigType;
  webLinks?: GenericTransConfigType;
  workflowTasks?: GenericTransConfigType;
};

export type sObjectTransKeySubset =
  | 'fields'
  | 'layouts'
  | 'fieldSets'
  | 'quickActions'
  | 'recordTypes'
  | 'sharingReasons'
  | 'validationRules'
  | 'webLinks'
  | 'workflowTasks'
  | 'caseValues';

export type sObjectTransArrayTypes =
  | ObjectNameCaseValue
  | FieldSetTranslation
  | CustomFieldTranslation
  | LayoutTranslation
  | QuickActionTranslation
  | RecordTypeTranslation
  | SharingReasonTranslation
  | StandardFieldTranslation
  | ValidationRuleTranslation
  | WebLinkTranslation
  | WorkflowTaskTranslation;

export type GenericPermConfigType = {
  allPermissions?: boolean;
  permissionsFor?: string[];
};

export type GenericTransConfigType = {
  allTranslations?: boolean;
  translationsFor?: string[];
};

export type ProfileConfigType = {
  sObjects?: sObjectPermConfigType[];
  apexClasses?: GenericPermConfigType;
  apexPages?: GenericPermConfigType;
  customApplications?: GenericPermConfigType;
  customMetadataTypes?: GenericPermConfigType;
  customPermissions?: GenericPermConfigType;
  customSettings?: GenericPermConfigType;
  loginIpRanges?: boolean;
  loginHours?: boolean;
  customTabs?: GenericPermConfigType;
  userPermissions?: GenericPermConfigType;
  externalDataSource?: GenericPermConfigType;
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
};

export type TranslationConfigType = {
  sObjects?: sObjectTransConfigType[];
  customApplications?: GenericTransConfigType;
  customLabels?: GenericTransConfigType;
  flows?: GenericTransConfigType;
  globalQuickActions?: GenericTransConfigType;
  reportTypes?: GenericTransConfigType;
  isRenameTranslations: boolean;
  isFieldTranslations: boolean;
  isLayoutTranslations: boolean;
  isLayoutTranslationsWithNamedItems: boolean;
  isFieldSetTranslations: boolean;
  isFieldSetTranslationsWithNamedItems: boolean;
  isQuickActionTranslations: boolean;
  isQuickActionTranslationsWithNamedItems: boolean;
  isRecordTypeTranslations: boolean;
  isRecordTypeTranslationsWithNamedItems: boolean;
  isSharingReasonTranslations: boolean;
  isSharingReasonTranslationsWithNamedItems: boolean;
  isValidationRuleTranslations: boolean;
  isValidationRuleTranslationsWithNamedItems: boolean;
  isWebLinkTranslations: boolean;
  isWebLinkTranslationsWithNamedItems: boolean;
  isWorkflowTaskTranslations: boolean;
  isWorkflowTaskTranslationsWithNamedItems: boolean;
  isCustomApplicationTranslations: boolean;
  isCustomApplicationTranslationsWithNamedItems: boolean;
  isCustomLabelTranslations: boolean;
  isCustomLabelTranslationsWithNamedItems: boolean;
  isCustomTabTranslations: boolean;
  isCustomTabTranslationsWithNamedItems: boolean;
  isFlowTranslations: boolean;
  isFlowTranslationsWithNamedItems: boolean;
  isGlobalQuickActionTranslations: boolean;
  isGlobalQuickActionTranslationsWithNamedItems: boolean;
  isReportTypeTranslations: boolean;
  isReportTypeTranslationsWithNamedItems: boolean;
};

export type UpdaterOptionsType = {
  configPath: string | undefined;
  orgUsername: string;
  projectPath: string;
  projectPackDir: NamedPackageDir[];
  apiVersion: string;
  connection: Connection;
  rootClass: SfCommand<UpdateOutput>;
};

export type ProfileInfoType = {
  profilename: string;
  filename: string;
  path: string;
};

export type ParsedProfile = {
  Profile: ProfileCustom;
};

export type ProfileCustom = Omit<Profile, 'externalDataSourceAccesses' | 'loginIpRanges'> & {
  externalDataSourceAccesses?: ProfileExternalDataSourceAccess[];
  loginIpRanges?: ProfileLoginIpRange[];
  customSettingAccesses?: ProfileCustomSettingAccesses[];
};

export type ProfileCustomSettingAccesses = {
  enabled: boolean;
  name: string;
};

export type CustomTabLightType = {
  name: string;
  sobjectName: string;
};

export type SimpleToolingResponse = {
  name: string;
};

export type UpdateOutput = { success: boolean };

export type InitConfigOutput = { path: string };

export type ParsedCustomObjectTranslation = {
  CustomObjectTranslation: CustomObjectTranslation;
};
export type ParsedTranslation = {
  Translations: Translations;
};

export type TransKeySubset = 'customApplications' | 'customLabels' | 'flowDefinitions' | 'quickActions' | 'reportTypes';

export type TransArrayTypes =
  | CustomApplicationTranslation
  | CustomLabelTranslation
  | FlowDefinitionTranslation
  | GlobalQuickActionTranslation
  | ReportTypeTranslation;
