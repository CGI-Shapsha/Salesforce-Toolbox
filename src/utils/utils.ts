/**
 * @description various utility methods
 * @author Philippe Planchon <planchon.phil@gmail.com>
 */
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as xml2js from 'xml2js';
import { ComponentSet, MetadataResolver, registry, SourceComponent } from '@salesforce/source-deploy-retrieve';
import { Connection, NamedPackageDir, SfError } from '@salesforce/core';
import { CustomObjectTranslation, Translations } from '@jsforce/jsforce-node/lib/api/metadata.js';
import { FileProperties } from '@jsforce/jsforce-node/lib/api/metadata.js';
import { ListMetadataQuery } from '@salesforce/source-deploy-retrieve/lib/src/client/types.js';
import { SfCommand, Spinner } from '@salesforce/sf-plugins-core';
import { deleteDirRecursive, deleteFile } from './dirManagment.js';
import {
  ProfileItem,
  ProfileConfigType,
  TranslationConfigType,
  ManifestType,
  TypeMembersType,
  ProfileInfoType,
  ParsedProfile,
  GenericPermConfigType,
  ProfileCustom,
  CustomTabLightType,
  UpdateOutput,
  UpdaterOptionsType,
  GenericTransConfigType,
  SimpleToolingResponse,
  sObjectTransArrayTypes,
  TransArrayTypes,
} from './typeDefs.js';
import { emptyObjTranslation, emptyProfile, emptyTranslation, manifestJSONBase } from './constants.js';

const sortProfile = function (profileJson: ParsedProfile): ParsedProfile {
  if (!profileJson || !Object.prototype.hasOwnProperty.call(profileJson, 'Profile')) return profileJson;

  const profile = profileJson.Profile;
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
  type SortMappingKeyType = keyof typeof sortMapping;

  for (const metaName of Object.keys(sortMapping) as SortMappingKeyType[]) {
    if (Object.prototype.hasOwnProperty.call(profile, metaName)) {
      if (!profile[metaName]) {
        delete profile[metaName];
        continue;
      }

      customSort<ProfileItem>(profile[metaName] as ProfileItem[], sortMapping[metaName]);
    }
  }

  profileJson.Profile = (Object.keys(profile) as Array<keyof ProfileCustom>).sort().reduce<ProfileCustom>(
    (obj, key) => {
      (obj[key] as unknown) = profile[key];
      return obj;
    },
    { ...emptyProfile }
  );

  // delete empty keys
  for (const metaName of Object.keys(profileJson.Profile) as Array<keyof ProfileCustom>) {
    if (
      !profileJson.Profile[metaName] ||
      (profileJson.Profile[metaName] as unknown[]).length === 0 ||
      Object.keys(profileJson.Profile[metaName] as ProfileItem[]).length === 0
    ) {
      delete profileJson.Profile[metaName];
    }
  }

  return profileJson;
};

const sortObjTranslation = function (objTranslation: CustomObjectTranslation): CustomObjectTranslation {
  if (!objTranslation) return objTranslation;

  const sortMapping = {
    caseValues: undefined,
    fieldSets: 'name',
    layouts: 'layout',
    quickActions: 'name',
    recordTypes: 'name',
    sharingReasons: 'name',
    validationRules: 'name',
    webLinks: 'name',
    workflowTasks: 'name',
  };
  type SortMappingKeyType = keyof typeof sortMapping;

  for (const metaType of Object.keys(sortMapping) as SortMappingKeyType[]) {
    if (Object.prototype.hasOwnProperty.call(objTranslation, metaType)) {
      if (!objTranslation[metaType]) {
        delete objTranslation[metaType];
        continue;
      }
      if (sortMapping[metaType]) {
        customSort(objTranslation[metaType] as sObjectTransArrayTypes[], sortMapping[metaType]);
      }
    }
  }

  objTranslation = (Object.keys(objTranslation) as Array<keyof CustomObjectTranslation>)
    .sort()
    .reduce<CustomObjectTranslation>(
      (obj, key) => {
        (obj[key] as unknown) = objTranslation[key];
        return obj;
      },
      { ...emptyObjTranslation }
    );

  // delete empty keys
  for (const metaName of Object.keys(objTranslation) as Array<keyof CustomObjectTranslation>) {
    if (
      !objTranslation[metaName] ||
      (objTranslation[metaName] as unknown[]).length === 0 ||
      Object.keys(objTranslation[metaName] as sObjectTransArrayTypes[]).length === 0
    ) {
      delete objTranslation[metaName];
    }
  }

  return objTranslation;
};

const sortTranslation = function (translation: Translations): Translations {
  if (!translation) return translation;

  const sortMapping = {
    // bots: undefined,
    customApplications: 'name',
    customLabels: 'name',
    // customPageWebLinks: 'name',
    // customTabs: 'name',
    flowDefinitions: 'fullName',
    // pipelineInspMetricConfigs: undefined,
    // prompts: undefined,
    quickActions: 'name',
    reportTypes: 'name',
    // scontrols: 'name'
  };
  type SortMappingKeyType = keyof typeof sortMapping;

  for (const metaType of Object.keys(sortMapping) as SortMappingKeyType[]) {
    if (Object.prototype.hasOwnProperty.call(translation, metaType)) {
      if (!translation[metaType]) {
        delete translation[metaType];
        continue;
      }
      if (sortMapping[metaType]) {
        customSort(translation[metaType] as TransArrayTypes[], sortMapping[metaType]);
      }
    }
  }

  translation = (Object.keys(translation) as Array<keyof Translations>).sort().reduce<Translations>(
    (obj, key) => {
      (obj[key] as unknown) = translation[key];
      return obj;
    },
    { ...emptyTranslation }
  );

  // delete empty keys
  for (const metaName of Object.keys(translation) as Array<keyof Translations>) {
    if (
      !translation[metaName] ||
      (translation[metaName] as unknown[]).length === 0 ||
      Object.keys(translation[metaName] as TransArrayTypes[]).length === 0
    ) {
      delete translation[metaName];
    }
  }

  return translation;
};

const customSort = function <T>(arr: T[], prop: string | undefined): T[] {
  if (!prop) return arr;
  return arr.sort((a, b): number => (a[prop as keyof T] < b[prop as keyof T] ? -1 : 1));
};

// eslint-disable-next-line complexity
const getProfileConfig = async function (configPath: string): Promise<ProfileConfigType> {
  if (!fs.existsSync(path.resolve(configPath))) {
    throw new SfError(
      "Config file does not exists ! Please run sfdx CGI:profiles:initConfig or provide a path to a config file with '-c' flag"
    );
  }

  const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8')) as ProfileConfigType;

  config.isFieldPermissions =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) => !!sObj.fields?.allPermissions || (sObj.fields?.permissionsFor && sObj.fields.permissionsFor.length > 0)
    );
  config.isObjectPermissions =
    !!config.sObjects && !!config.sObjects.find((sObj) => sObj.retrieveObjectPermissions === true);
  config.isRecordTypePermissions =
    !!config.sObjects && !!config.sObjects.find((sObj) => sObj.retrieveRecordTypeVisibilities === true);
  config.isLayoutAssignments =
    !!config.sObjects && !!config.sObjects.find((sObj) => sObj.retrieveLayoutAssignments === true);
  config.isApexPermissions = checkGenericPermConfig(config.apexClasses);
  config.isPagePermissions = checkGenericPermConfig(config.apexPages);
  config.isCustomApplicationPermissions = checkGenericPermConfig(config.customApplications);
  config.isCustomMetadataPermissions = checkGenericPermConfig(config.customMetadataTypes);
  config.isCustomPermissionPermissions = checkGenericPermConfig(config.customPermissions);
  config.isCustomSettingPermissions = checkGenericPermConfig(config.customSettings);
  config.isCustomTabPermissions = checkGenericPermConfig(config.customTabs);
  config.isUserPermissions = checkGenericPermConfig(config.userPermissions);
  config.isExternalDataSource = checkGenericPermConfig(config.externalDataSource);

  if (
    !(
      config.isApexPermissions ||
      config.isPagePermissions ||
      config.isFieldPermissions ||
      config.isObjectPermissions ||
      config.isRecordTypePermissions ||
      config.isLayoutAssignments ||
      config.isCustomApplicationPermissions ||
      config.isCustomMetadataPermissions ||
      config.isCustomPermissionPermissions ||
      config.isCustomSettingPermissions ||
      !!config.loginIpRanges ||
      !!config.loginHours ||
      config.isCustomTabPermissions ||
      config.isUserPermissions ||
      config.isExternalDataSource
    )
  ) {
    throw new SfError('Config file contains no permissions to retrieve ! Please edit it.');
  }

  return config;
};

// eslint-disable-next-line complexity
const getTranslationConfig = async function (configPath: string): Promise<TranslationConfigType> {
  if (!fs.existsSync(path.resolve(configPath))) {
    throw new SfError(
      "Config file does not exists ! Please run sfdx CGI:translations:initConfig or provide a path to a config file with '-c' flag"
    );
  }

  let isTranslations = false;
  let isTranslationsWithNamedItems = false;

  const config = JSON.parse(await fs.promises.readFile(configPath, 'utf-8')) as TranslationConfigType;

  config.isRenameTranslations =
    !!config.sObjects && !!config.sObjects.find((sObj) => sObj.retrieveObjectRenameTranslations === true);
  config.isFieldTranslations =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !!sObj.fields?.allTranslations || (sObj.fields?.translationsFor && sObj.fields.translationsFor.length > 0)
    );
  config.isLayoutTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.layouts?.allTranslations && sObj.layouts?.translationsFor && sObj.layouts.translationsFor.length > 0
    );
  config.isLayoutTranslations =
    config.isLayoutTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => !!sObj.layouts?.allTranslations));
  config.isFieldSetTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.fieldSets?.allTranslations && sObj.fieldSets?.translationsFor && sObj.fieldSets.translationsFor.length > 0
    );
  config.isFieldSetTranslations =
    config.isFieldSetTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => sObj.fieldSets?.allTranslations));
  config.isQuickActionTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.quickActions?.allTranslations &&
        sObj.quickActions?.translationsFor &&
        sObj.quickActions.translationsFor.length > 0
    );
  config.isQuickActionTranslations =
    config.isQuickActionTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => sObj.quickActions?.allTranslations));
  config.isRecordTypeTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.recordTypes?.allTranslations &&
        sObj.recordTypes?.translationsFor &&
        sObj.recordTypes.translationsFor.length > 0
    );
  config.isRecordTypeTranslations =
    config.isRecordTypeTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => sObj.recordTypes?.allTranslations));
  config.isSharingReasonTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.sharingReasons?.allTranslations &&
        sObj.sharingReasons?.translationsFor &&
        sObj.sharingReasons.translationsFor.length > 0
    );
  config.isSharingReasonTranslations =
    config.isSharingReasonTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => sObj.sharingReasons?.allTranslations));
  config.isValidationRuleTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.validationRules?.allTranslations &&
        sObj.validationRules?.translationsFor &&
        sObj.validationRules.translationsFor.length > 0
    );
  config.isValidationRuleTranslations =
    config.isValidationRuleTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => sObj.validationRules?.allTranslations));
  config.isWebLinkTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.webLinks?.allTranslations && sObj.webLinks?.translationsFor && sObj.webLinks.translationsFor.length > 0
    );
  config.isWebLinkTranslations =
    config.isWebLinkTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => sObj.webLinks?.allTranslations));
  config.isWorkflowTaskTranslationsWithNamedItems =
    !!config.sObjects &&
    !!config.sObjects.find(
      (sObj) =>
        !sObj.workflowTasks?.allTranslations &&
        sObj.workflowTasks?.translationsFor &&
        sObj.workflowTasks.translationsFor.length > 0
    );
  config.isWorkflowTaskTranslations =
    config.isWorkflowTaskTranslationsWithNamedItems ||
    (!!config.sObjects && !!config.sObjects.find((sObj) => sObj.workflowTasks?.allTranslations));
  ({ isTranslations, isTranslationsWithNamedItems } = checkGenericTransConfig(config.customApplications));
  config.isCustomApplicationTranslationsWithNamedItems = isTranslationsWithNamedItems;
  config.isCustomApplicationTranslations = isTranslations;
  ({ isTranslations, isTranslationsWithNamedItems } = checkGenericTransConfig(config.customLabels));
  config.isCustomLabelTranslationsWithNamedItems = isTranslationsWithNamedItems;
  config.isCustomLabelTranslations = isTranslations;
  ({ isTranslations, isTranslationsWithNamedItems } = checkGenericTransConfig(config.flows));
  config.isFlowTranslationsWithNamedItems = isTranslationsWithNamedItems;
  config.isFlowTranslations = isTranslations;
  ({ isTranslations, isTranslationsWithNamedItems } = checkGenericTransConfig(config.globalQuickActions));
  config.isGlobalQuickActionTranslationsWithNamedItems = isTranslationsWithNamedItems;
  config.isGlobalQuickActionTranslations = isTranslations;
  ({ isTranslations, isTranslationsWithNamedItems } = checkGenericTransConfig(config.reportTypes));
  config.isReportTypeTranslationsWithNamedItems = isTranslationsWithNamedItems;
  config.isReportTypeTranslations = isTranslations;

  if (
    !(
      config.isRenameTranslations ||
      config.isFieldTranslations ||
      config.isLayoutTranslations ||
      config.isFieldSetTranslations ||
      config.isQuickActionTranslations ||
      config.isRecordTypeTranslations ||
      config.isSharingReasonTranslations ||
      config.isValidationRuleTranslations ||
      config.isWebLinkTranslations ||
      config.isWorkflowTaskTranslations ||
      config.isCustomApplicationTranslations ||
      config.isCustomLabelTranslations ||
      config.isCustomTabTranslations ||
      config.isFlowTranslations ||
      config.isGlobalQuickActionTranslations ||
      config.isReportTypeTranslations
    )
  ) {
    throw new SfError('Config file contains no translation to retrieve ! Please edit it.');
  }

  return config;
};

const checkGenericPermConfig = function (genericConfig: GenericPermConfigType | undefined): boolean {
  if (!genericConfig) return false;

  return genericConfig.allPermissions ?? (!!genericConfig.permissionsFor && genericConfig.permissionsFor.length > 0);
};

const checkGenericTransConfig = function (genericConfig: GenericTransConfigType | undefined): {
  isTranslations: boolean;
  isTranslationsWithNamedItems: boolean;
} {
  let isTranslations = false;
  let isTranslationsWithNamedItems = false;
  if (genericConfig) {
    const isAllTranslations = !!genericConfig.allTranslations;
    isTranslationsWithNamedItems =
      !isAllTranslations && !!genericConfig.translationsFor && genericConfig.translationsFor.length > 0;
    isTranslations = isAllTranslations || isTranslationsWithNamedItems;
  }

  return { isTranslations, isTranslationsWithNamedItems };
};

const readXml = async function (xmlPath: string): Promise<Record<string, unknown>> {
  const profileRaw = await fs.promises.readFile(xmlPath);

  const parser = new xml2js.Parser();
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const parserPromised: (buffer: Buffer) => Promise<Record<string, unknown>> = promisify(parser.parseString);

  return parserPromised(profileRaw);
};

const writeXml = async function (xmlPath: string, jsonContent: Record<string, unknown>): Promise<void> {
  const builderOptions = {
    renderOpts: { pretty: true, indent: '    ', newline: '\n', allowEmpty: true },
    xmldec: { version: '1.0', encoding: 'UTF-8' },
  };
  const builder = new xml2js.Builder(builderOptions);
  const xml = builder.buildObject(jsonContent);
  await fs.promises.writeFile(xmlPath, xml + '\n');
};

// eslint-disable-next-line complexity
const generateProfileManifest = async function (
  options: UpdaterOptionsType,
  config: ProfileConfigType,
  apiVersion: string,
  workingDirPath: string,
  manifestFileName: string
): Promise<string> {
  const manifestFilePath = path.join(workingDirPath, manifestFileName);
  // Delete old manifest
  await deleteFile(manifestFilePath);

  const mdtList =
    config.isCustomMetadataPermissions && config.customMetadataTypes?.allPermissions
      ? (await getMetadataList(options.connection, registry.types.customobject.name)).filter((sObject) =>
          sObject.fullName.endsWith('__mdt')
        )
      : undefined;
  const customSettingList =
    config.isCustomSettingPermissions && config.customSettings?.allPermissions
      ? await getAllCustomSettingList(options.connection)
      : undefined;
  const customTabList =
    config.isCustomTabPermissions && config.customTabs?.allPermissions
      ? await getAllCustomTabList(options.connection, options.apiVersion)
      : undefined;

  let manifestJSON = { ...manifestJSONBase };
  manifestJSON.Package.version = apiVersion;

  if (
    config.isObjectPermissions ||
    config.isFieldPermissions ||
    config.isRecordTypePermissions ||
    config.isLayoutAssignments ||
    config.isCustomMetadataPermissions ||
    config.isCustomSettingPermissions ||
    config.isCustomTabPermissions
  ) {
    manifestJSON = addSObjectsToManifest(manifestJSON, config, mdtList, customSettingList, customTabList);
  }

  config.sObjects = config.sObjects ?? [];
  if (config.isLayoutAssignments) {
    const sObjectAPINames: Set<string> = new Set<string>();
    for (const sObject of config.sObjects) {
      if (sObject.retrieveLayoutAssignments) {
        sObjectAPINames.add(sObject.apiName);
      }
    }
    const layoutList = await getMetadataList(options.connection, registry.types.layout.name);
    ({ manifestJSON } = addLayoutsToManifest(manifestJSON, sObjectAPINames, layoutList));
  }

  if (config.isApexPermissions) {
    manifestJSON = addGenericMetadataToManifest(manifestJSON, config.apexClasses, registry.types.apexclass.name);
  }

  if (config.isPagePermissions) {
    manifestJSON = addGenericMetadataToManifest(manifestJSON, config.apexPages, registry.types.apexpage.name);
  }

  if (config.isCustomApplicationPermissions) {
    manifestJSON = addGenericMetadataToManifest(
      manifestJSON,
      config.customApplications,
      registry.types.customapplication.name
    );
  }

  if (config.isCustomPermissionPermissions) {
    manifestJSON = addGenericMetadataToManifest(
      manifestJSON,
      config.customPermissions,
      registry.types.custompermission.name
    );
  }

  if (config.isCustomTabPermissions) {
    manifestJSON = addCustomTabsToManifest(manifestJSON, config.customTabs);
  }

  if (config.isExternalDataSource) {
    manifestJSON = addGenericMetadataToManifest(
      manifestJSON,
      config.externalDataSource,
      registry.types.externaldatasource.name
    );
  }

  manifestJSON = addGenericMetadataToManifest(manifestJSON, { allPermissions: true }, registry.types.profile.name);

  await writeXml(manifestFilePath, manifestJSON);

  return manifestFilePath;
};

// eslint-disable-next-line complexity
const generateTranslationManifest = async function (
  config: TranslationConfigType,
  apiVersion: string,
  workingDirPath: string,
  manifestFileName: string,
  activatedLanguages: string[],
  connection: Connection
): Promise<{ manifestFilePath: string; sObjectTranslationSet: Set<string> }> {
  const manifestFilePath = path.join(workingDirPath, manifestFileName);
  // Delete old manifest
  await deleteFile(manifestFilePath);

  let sObjectTranslationSet: Set<string> = new Set<string>();
  let manifestJSON = { ...manifestJSONBase };
  manifestJSON.Package.version = apiVersion;

  config.sObjects = config.sObjects ?? [];
  if (config.isLayoutTranslations) {
    const fullLayoutList = await getMetadataList(connection, registry.types.layout.name);
    const sObjectAPINamesForAllLayouts: Set<string> = new Set<string>();
    const sObjectAPINamesForSpecificLayouts: Record<string, string[]> = {};
    for (const sObject of config.sObjects) {
      if (sObject.layouts?.allTranslations) {
        sObjectAPINamesForAllLayouts.add(sObject.apiName);
      } else if (sObject.layouts?.translationsFor && sObject.layouts.translationsFor.length > 0) {
        if (!Object.prototype.hasOwnProperty.call(sObjectAPINamesForSpecificLayouts, sObject.apiName)) {
          sObjectAPINamesForSpecificLayouts[sObject.apiName] = [];
        }
        sObjectAPINamesForSpecificLayouts[sObject.apiName].push(...sObject.layouts.translationsFor);
      }
    }
    let isLayoutsAdded = false;
    ({ manifestJSON, isLayoutsAdded } = addLayoutsToManifest(
      manifestJSON,
      sObjectAPINamesForAllLayouts,
      fullLayoutList,
      sObjectAPINamesForSpecificLayouts
    ));

    config.isLayoutTranslations = isLayoutsAdded;
  }

  if (config.isQuickActionTranslations) {
    const fullQuickActionList = await getMetadataList(connection, registry.types.quickaction.name);
    const sObjectAPINamesForAllQuickActions: Set<string> = new Set<string>();
    const sObjectAPINamesForSpecificQuickActions: Record<string, string[]> = {};
    for (const sObject of config.sObjects) {
      if (sObject.quickActions?.allTranslations) {
        sObjectAPINamesForAllQuickActions.add(sObject.apiName);
      } else if (sObject.quickActions?.translationsFor && sObject.quickActions.translationsFor.length > 0) {
        if (!Object.prototype.hasOwnProperty.call(sObjectAPINamesForSpecificQuickActions, sObject.apiName)) {
          sObjectAPINamesForSpecificQuickActions[sObject.apiName] = [];
        }
        sObjectAPINamesForSpecificQuickActions[sObject.apiName].push(...sObject.quickActions.translationsFor);
      }
    }
    let isQuickActionsAdded = false;
    ({ manifestJSON, isQuickActionsAdded } = addQuickActionsToManifest(
      manifestJSON,
      sObjectAPINamesForAllQuickActions,
      fullQuickActionList,
      sObjectAPINamesForSpecificQuickActions
    ));

    config.isQuickActionTranslations = isQuickActionsAdded;
  }

  if (config.isWorkflowTaskTranslations) {
    const fullWorkflowList = await getMetadataList(connection, registry.types.workflow.name);
    const sObjectAPINamesForWorkflowTasks: Set<string> = new Set<string>();
    for (const sObject of config.sObjects) {
      if (
        !!sObject.workflowTasks?.allTranslations ||
        (sObject.workflowTasks?.translationsFor && sObject.workflowTasks.translationsFor.length > 0)
      ) {
        sObjectAPINamesForWorkflowTasks.add(sObject.apiName);
      }
    }
    let isWorkflowsAdded = false;
    ({ manifestJSON, isWorkflowsAdded } = addWorkflowsToManifest(
      manifestJSON,
      sObjectAPINamesForWorkflowTasks,
      fullWorkflowList
    ));

    config.isWorkflowTaskTranslations = isWorkflowsAdded;
  }

  if (
    config.isRenameTranslations ||
    config.isFieldTranslations ||
    config.isLayoutTranslations ||
    config.isFieldSetTranslations ||
    config.isQuickActionTranslations ||
    config.isRecordTypeTranslations ||
    config.isSharingReasonTranslations ||
    config.isValidationRuleTranslations ||
    config.isWebLinkTranslations ||
    config.isWorkflowTaskTranslations
  ) {
    ({ manifestJSON, sObjectTranslationSet } = addTranslationSObjectsToManifest(
      manifestJSON,
      config,
      activatedLanguages
    ));
  }

  if (config.isCustomApplicationTranslations) {
    let isItemAdded = false;
    ({ manifestJSON, isItemAdded } = addGenericTypeToManifestWithWildcard(
      manifestJSON,
      config.customApplications,
      registry.types.customapplication.name
    ));

    config.isCustomApplicationTranslations = isItemAdded;
  }

  if (config.isCustomLabelTranslations) {
    let isItemAdded = false;
    ({ manifestJSON, isItemAdded } = addGenericTypeToManifestWithWildcard(
      manifestJSON,
      config.customLabels,
      registry.types.customlabels.name
    ));

    config.isCustomLabelTranslations = isItemAdded;
  }

  if (config.isFlowTranslations) {
    let isItemAdded = false;
    ({ manifestJSON, isItemAdded } = addGenericTypeToManifestWithWildcard(
      manifestJSON,
      config.flows,
      registry.types.flow.name
    ));

    config.isFlowTranslations = isItemAdded;
  }

  if (config.isGlobalQuickActionTranslations) {
    const allGlobalQuickActions = await getAllGlobalQuickActionsList(connection, apiVersion);
    let isItemAdded = false;
    ({ manifestJSON, isItemAdded } = addGenericTypeToManifest(
      manifestJSON,
      config.globalQuickActions,
      allGlobalQuickActions,
      registry.types.quickaction.name
    ));

    config.isGlobalQuickActionTranslations = isItemAdded;
  }

  if (config.isReportTypeTranslations) {
    let isItemAdded = false;
    ({ manifestJSON, isItemAdded } = addGenericTypeToManifestWithWildcard(
      manifestJSON,
      config.reportTypes,
      registry.types.reporttype.name
    ));

    config.isReportTypeTranslations = isItemAdded;
  }

  if (
    config.isCustomApplicationTranslations ||
    config.isCustomLabelTranslations ||
    config.isFlowTranslations ||
    config.isGlobalQuickActionTranslations ||
    config.isReportTypeTranslations
  ) {
    ({ manifestJSON } = addGenericTypeToManifestWithWildcard(
      manifestJSON,
      { allTranslations: true },
      registry.types.translations.name
    ));
  }

  if (manifestJSON.Package.types.length > 0) {
    await writeXml(manifestFilePath, manifestJSON);
  }

  return { manifestFilePath, sObjectTranslationSet };
};

// eslint-disable-next-line complexity
const addSObjectsToManifest = function (
  manifestJSON: ManifestType,
  config: ProfileConfigType,
  cmtList: FileProperties[] | undefined,
  customSetingList: string[] | undefined,
  customTabList: CustomTabLightType[] | undefined
): ManifestType {
  const sObjectSet: Set<string> = new Set<string>();
  const customObjectsMembers: TypeMembersType[] = [];

  config.sObjects = config.sObjects ?? [];
  if (
    config.isObjectPermissions ||
    config.isFieldPermissions ||
    config.isRecordTypePermissions ||
    config.isLayoutAssignments
  ) {
    for (const sObject of config.sObjects) {
      sObjectSet.add(sObject.apiName);
    }
  }

  if (config.isCustomMetadataPermissions) {
    if (config.customMetadataTypes!.allPermissions && !!cmtList) {
      for (const cmt of cmtList) {
        sObjectSet.add(cmt.fullName);
      }
    } else if (config.customMetadataTypes?.permissionsFor && config.customMetadataTypes.permissionsFor.length > 0) {
      for (const cmt of config.customMetadataTypes.permissionsFor) {
        sObjectSet.add(cmt);
      }
    }
  }

  if (config.isCustomSettingPermissions && config.customSettings) {
    if (config.customSettings.allPermissions && !!customSetingList) {
      for (const custSet of customSetingList) {
        sObjectSet.add(custSet);
      }
    } else if (config.customSettings.permissionsFor && config.customSettings.permissionsFor.length > 0) {
      for (const custSet of config.customSettings.permissionsFor) {
        sObjectSet.add(custSet);
      }
    }
  }

  if (config.isCustomTabPermissions && config.customTabs) {
    if (config.customTabs.allPermissions && !!customTabList) {
      for (const custTab of customTabList) {
        if (custTab.name.startsWith('standard-')) {
          sObjectSet.add(custTab.sobjectName);
        }
      }
    } else if (config.customTabs.permissionsFor && config.customTabs.permissionsFor.length > 0) {
      for (const custTab of config.customTabs.permissionsFor) {
        if (custTab.startsWith('standard-')) {
          sObjectSet.add(custTab.split('-')[1]);
        }
      }
    }
  }

  for (const sObj of sObjectSet) {
    customObjectsMembers.push({
      _: sObj,
    });
  }

  manifestJSON.Package.types.push({
    members: customObjectsMembers,
    name: registry.types.customobject.name,
  });

  return manifestJSON;
};

// eslint-disable-next-line complexity
const addTranslationSObjectsToManifest = function (
  manifestJSON: ManifestType,
  config: TranslationConfigType,
  activatedLanguages: string[]
): { manifestJSON: ManifestType; sObjectTranslationSet: Set<string> } {
  config.sObjects = config.sObjects ?? [];
  const sObjectSet: Set<string> = new Set<string>();
  const sObjectTranslationSet: Set<string> = new Set<string>();
  const customObjectsMembers: TypeMembersType[] = [];
  const customObjectsTranslationMembers: TypeMembersType[] = [];

  for (const sObject of config.sObjects) {
    if (
      !!sObject.retrieveObjectRenameTranslations ||
      !!sObject.fields?.allTranslations ||
      (!!sObject.fields?.translationsFor && sObject.fields.translationsFor.length > 0) ||
      !!sObject.layouts?.allTranslations ||
      (!!sObject.layouts?.translationsFor && sObject.layouts.translationsFor.length > 0) ||
      !!sObject.fieldSets?.allTranslations ||
      (!!sObject.fieldSets?.translationsFor && sObject.fieldSets.translationsFor.length > 0) ||
      !!sObject.quickActions?.allTranslations ||
      (!!sObject.quickActions?.translationsFor && sObject.quickActions.translationsFor.length > 0) ||
      !!sObject.recordTypes?.allTranslations ||
      (!!sObject.recordTypes?.translationsFor && sObject.recordTypes.translationsFor.length > 0) ||
      !!sObject.sharingReasons?.allTranslations ||
      (!!sObject.sharingReasons?.translationsFor && sObject.sharingReasons.translationsFor.length > 0) ||
      !!sObject.validationRules?.allTranslations ||
      (!!sObject.validationRules?.translationsFor && sObject.validationRules.translationsFor.length > 0) ||
      !!sObject.webLinks?.allTranslations ||
      (!!sObject.webLinks?.translationsFor && sObject.webLinks.translationsFor.length > 0) ||
      !!sObject.workflowTasks?.allTranslations ||
      (!!sObject.workflowTasks?.translationsFor && sObject.workflowTasks.translationsFor.length > 0)
    ) {
      sObjectSet.add(sObject.apiName);
      activatedLanguages.forEach((l) => {
        sObjectTranslationSet.add(`${sObject.apiName}-${l}`);
      });
    }
  }

  for (const sObj of sObjectSet) {
    customObjectsMembers.push({
      _: sObj,
    });
  }

  for (const sObjTranslation of sObjectTranslationSet) {
    customObjectsTranslationMembers.push({
      _: sObjTranslation,
    });
  }

  manifestJSON.Package.types.push({
    members: customObjectsMembers,
    name: registry.types.customobject.name,
  });

  manifestJSON.Package.types.push({
    members: customObjectsTranslationMembers,
    name: registry.types.customobjecttranslation.name,
  });

  return { manifestJSON, sObjectTranslationSet };
};

const addLayoutsToManifest = function (
  manifestJSON: ManifestType,
  sObjectAPINames: Set<string>,
  layoutList: FileProperties[],
  sObjectAPINamesForSpecificLayouts: Record<string, string[]> = {}
): { manifestJSON: ManifestType; isLayoutsAdded: boolean } {
  const layoutMembers: TypeMembersType[] = [];

  for (const sObjectAPIName of sObjectAPINames) {
    for (const layoutItem of layoutList) {
      if (layoutItem.fullName.startsWith(`${sObjectAPIName}-`)) {
        layoutMembers.push({
          _: getLayoutFullNameWithNamespace(layoutItem),
        });
      }
    }
  }

  for (const [sObjectAPIName, layouts] of Object.entries(sObjectAPINamesForSpecificLayouts)) {
    for (const layoutName of layouts) {
      const layoutProp = layoutList.find((lp) => lp.fullName === `${sObjectAPIName}-${layoutName}`);
      if (layoutProp) {
        layoutMembers.push({
          _: getLayoutFullNameWithNamespace(layoutProp),
        });
      }
    }
  }

  let isLayoutsAdded = false;
  if (layoutMembers.length > 0) {
    isLayoutsAdded = true;
    manifestJSON.Package.types.push({
      members: layoutMembers,
      name: registry.types.layout.name,
    });
  }

  return { manifestJSON, isLayoutsAdded };
};

const addQuickActionsToManifest = function (
  manifestJSON: ManifestType,
  sObjectAPINames: Set<string>,
  quickActionList: FileProperties[],
  sObjectAPINamesForSpecificQuickActions: Record<string, string[]> = {}
): { manifestJSON: ManifestType; isQuickActionsAdded: boolean } {
  const quickActionMembers: TypeMembersType[] = [];

  for (const sObjectAPIName of sObjectAPINames) {
    for (const quickActionItem of quickActionList) {
      if (quickActionItem.fullName.startsWith(`${sObjectAPIName}.`)) {
        quickActionMembers.push({
          _: quickActionItem.fullName,
        });
      }
    }
  }

  for (const [sObjectAPIName, quickActions] of Object.entries(sObjectAPINamesForSpecificQuickActions)) {
    for (const quickActionName of quickActions) {
      const quickActionProp = quickActionList.find((qap) => qap.fullName === `${sObjectAPIName}.${quickActionName}`);
      if (quickActionProp) {
        quickActionMembers.push({
          _: quickActionProp.fullName,
        });
      }
    }
  }

  let isQuickActionsAdded = false;
  if (quickActionMembers.length > 0) {
    isQuickActionsAdded = true;
    manifestJSON.Package.types.push({
      members: quickActionMembers,
      name: registry.types.quickaction.name,
    });
  }

  return { manifestJSON, isQuickActionsAdded };
};

const addWorkflowsToManifest = function (
  manifestJSON: ManifestType,
  sObjectAPINames: Set<string>,
  workflowList: FileProperties[]
): { manifestJSON: ManifestType; isWorkflowsAdded: boolean } {
  const workflowMembers: TypeMembersType[] = [];

  for (const sObjectAPIName of sObjectAPINames) {
    for (const workflowItem of workflowList) {
      if (workflowItem.fullName === sObjectAPIName) {
        workflowMembers.push({
          _: workflowItem.fullName,
        });
      }
    }
  }

  let isWorkflowsAdded = false;
  if (workflowMembers.length > 0) {
    isWorkflowsAdded = true;
    manifestJSON.Package.types.push({
      members: workflowMembers,
      name: registry.types.workflow.name,
    });
  }

  return { manifestJSON, isWorkflowsAdded };
};

const addGenericTypeToManifest = function (
  manifestJSON: ManifestType,
  genericConfig: GenericTransConfigType | undefined,
  fullItemList: SimpleToolingResponse[],
  itemTypeName: string
): { manifestJSON: ManifestType; isItemAdded: boolean } {
  const itemMembers: TypeMembersType[] = [];

  if (genericConfig?.allTranslations) {
    for (const item of fullItemList) {
      itemMembers.push({
        _: item.name,
      });
    }
  } else if (genericConfig?.translationsFor && genericConfig.translationsFor.length > 0) {
    for (const item of genericConfig.translationsFor) {
      itemMembers.push({
        _: item,
      });
    }
  }

  let isItemAdded = false;
  if (itemMembers.length > 0) {
    isItemAdded = true;
    manifestJSON.Package.types.push({
      members: itemMembers,
      name: itemTypeName,
    });
  }

  return { manifestJSON, isItemAdded };
};

const addGenericTypeToManifestWithWildcard = function (
  manifestJSON: ManifestType,
  genericConfig: GenericTransConfigType | undefined,
  itemTypeName: string
): { manifestJSON: ManifestType; isItemAdded: boolean } {
  const itemMembers: TypeMembersType[] = [];

  if (!!genericConfig?.allTranslations || itemTypeName === registry.types.customlabels.name) {
    itemMembers.push({
      _: '*',
    });
  } else if (genericConfig?.translationsFor && genericConfig.translationsFor.length > 0) {
    for (const item of genericConfig.translationsFor) {
      itemMembers.push({
        _: item,
      });
    }
  }

  let isItemAdded = false;
  if (itemMembers.length > 0) {
    isItemAdded = true;
    manifestJSON.Package.types.push({
      members: itemMembers,
      name: itemTypeName,
    });
  }

  return { manifestJSON, isItemAdded };
};

const getLayoutFullNameWithNamespace = function (layoutItem: FileProperties): string {
  let layoutFullName = layoutItem.fullName;
  if (layoutItem.namespacePrefix) {
    const splittedFullName = layoutItem.fullName.split('-');
    splittedFullName[1] = `${layoutItem.namespacePrefix}__${splittedFullName[1]}`;
    layoutFullName = splittedFullName.join('-');
  }
  return layoutFullName;
};

const addGenericMetadataToManifest = function (
  manifestJSON: ManifestType,
  configType: GenericPermConfigType | undefined,
  metadataName: string
): ManifestType {
  const typeMembers: TypeMembersType[] = [];

  if (configType?.allPermissions) {
    typeMembers.push({
      _: '*',
    });
  } else if (configType?.permissionsFor) {
    for (const elementName of configType.permissionsFor) {
      typeMembers.push({
        _: elementName,
      });
    }
  }

  manifestJSON.Package.types.push({
    members: typeMembers,
    name: metadataName,
  });

  return manifestJSON;
};

const addCustomTabsToManifest = function (
  manifestJSON: ManifestType,
  configType: GenericPermConfigType | undefined
): ManifestType {
  const typeMembers: TypeMembersType[] = [];

  if (configType?.allPermissions) {
    typeMembers.push({
      _: '*',
    });
  } else if (configType?.permissionsFor) {
    for (const elementName of configType.permissionsFor) {
      if (!elementName.startsWith('standard-')) {
        typeMembers.push({
          _: elementName,
        });
      }
    }
  }

  if (typeMembers.length > 0) {
    manifestJSON.Package.types.push({
      members: typeMembers,
      name: registry.types.customtab.name,
    });
  }

  return manifestJSON;
};

const retreiveFromManifest = async function (
  manifestPath: string,
  tempProjectPath: string,
  orgUsername: string,
  rootClass: SfCommand<UpdateOutput>,
  operation: string
): Promise<void> {
  if (!fs.existsSync(manifestPath)) {
    throw new SfError(`Config file contains no ${operation} to retrieve ! Please edit it.`);
  }

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

  rootClass.spinner = new Spinner(true);
  rootClass.spinner.start('Retrieving Metadata', 'Initializing');
  retrieve.onUpdate(({ status }) => {
    // ux.setSpinnerStatus(status);
    rootClass.spinner.status = status;
  });
  retrieve.onError((error) => {
    throw error;
  });
  await retrieve.pollStatus();
  rootClass.spinner.stop('✔️\n');
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
    projectPackageDirectories = projectPackageDirectories ?? [];
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

  const profileSourceFile: ProfileInfoType[] = profiles.map((elem) => ({
    profilename: elem.name,
    filename: path.basename(elem.xml!),
    path: elem.xml!,
  }));
  return profileSourceFile;
};

const loadTranslationsFromPackageDirectories = function (
  projectPath: string,
  sObjectTranslationSet: Set<string>,
  isTranslations: boolean,
  projectPackageDirectories?: NamedPackageDir[],
  userDefPackageDirectories?: string[]
): SourceComponent[] {
  const resolver = new MetadataResolver();
  let translations: SourceComponent[] = [];
  let packageDirectories: string[] = [];

  if (!userDefPackageDirectories || userDefPackageDirectories.length === 0) {
    packageDirectories = new Array<string>();
    projectPackageDirectories = projectPackageDirectories ?? [];
    for (const packageDirectory of projectPackageDirectories) {
      packageDirectories.push(packageDirectory.path);
    }
  } else {
    packageDirectories = userDefPackageDirectories;
  }

  packageDirectories = packageDirectories.map((packDir) => path.join(projectPath, packDir));

  const componentList = [];
  sObjectTranslationSet?.forEach((sot) => {
    componentList.push({ fullName: sot, type: registry.types.customobjecttranslation.name });
  });

  if (isTranslations) {
    componentList.push({ fullName: '*', type: registry.types.translations.name });
  }

  for (const packageDirectory of packageDirectories) {
    translations = translations.concat(
      resolver.getComponentsFromPath(packageDirectory, new ComponentSet(componentList))
    );
  }

  return translations;
};

const getMetadataList = async function (connection: Connection, metadataName: string): Promise<FileProperties[]> {
  const listmetadataQuery: ListMetadataQuery = {
    type: metadataName,
  };
  const metadataList = await connection.metadata.list(listmetadataQuery);

  return metadataList;
};

const getAllCustomSettingList = async function (connection: Connection): Promise<string[]> {
  const ret: string[] = [];
  const globalDesc = await connection.describeGlobal();
  for (const obj of globalDesc.sobjects) {
    if (obj.customSetting) {
      ret.push(obj.name);
    }
  }

  return ret;
};

const getAllCustomTabList = async function (connection: Connection, apiVersion: string): Promise<CustomTabLightType[]> {
  const ret: CustomTabLightType[] = [];
  const toolingResponse: CustomTabLightType[] = await connection.tooling.request(`/services/data/v${apiVersion}/tabs`);
  for (const { name, sobjectName } of toolingResponse) {
    ret.push({ name, sobjectName });
  }

  return ret;
};

const getAllGlobalQuickActionsList = async function (
  connection: Connection,
  apiVersion: string
): Promise<SimpleToolingResponse[]> {
  const ret: SimpleToolingResponse[] = [];
  const toolingResponse: SimpleToolingResponse[] = await connection.tooling.request(
    `/services/data/v${apiVersion}/quickActions`
  );
  for (const { name } of toolingResponse) {
    ret.push({ name });
  }

  return ret;
};

export {
  sortProfile,
  sortObjTranslation,
  sortTranslation,
  getProfileConfig,
  getTranslationConfig,
  readXml,
  writeXml,
  generateProfileManifest,
  generateTranslationManifest,
  retreiveFromManifest,
  loadProfileFromPackageDirectories,
  loadTranslationsFromPackageDirectories,
  getMetadataList,
  getAllCustomSettingList,
};
