/**
 * @description Methods used to update translations
 * @author Philippe Planchon <planchon.phil@gmail.com>
 */
/* eslint-disable no-await-in-loop */
import * as path from 'node:path';
import * as fs from 'node:fs';
import { registry, SourceComponent } from '@salesforce/source-deploy-retrieve';
// import { Translations } from '@salesforce/core/node_modules/jsforce/lib/api/metadata.js';
import {
  ObjectNameCaseValue,
  FieldSetTranslation,
  LayoutTranslation,
  QuickActionTranslation,
  RecordTypeTranslation,
  SharingReasonTranslation,
  ValidationRuleTranslation,
  WebLinkTranslation,
  WorkflowTaskTranslation,
} from '@jsforce/jsforce-node/lib/api/metadata.js';
import * as utils from './utils.js';
import {
  GenericTransConfigType,
  ParsedCustomObjectTranslation,
  ParsedTranslation,
  TranslationConfigType,
  UpdaterOptionsType,
  sObjectTransKeySubset,
  sObjectTransArrayTypes,
  TransArrayTypes,
  TransKeySubset,
} from './typeDefs.js';
import { tempProjectDirName, workingDirName } from './constants.js';
import {
  copyFile,
  copyFiles,
  deleteDirRecursive,
  deleteFile,
  deleteFiles,
  getAllFilesByEnding,
} from './dirManagment.js';

const objTransJSON: Record<string, ParsedCustomObjectTranslation> = {};
const transJSON: Record<string, ParsedTranslation> = {};
const objTransJSONModified: Set<string> = new Set<string>();
const transJSONModified: Set<string> = new Set<string>();

const updateFieldTranslations = async function (
  options: UpdaterOptionsType,
  config: TranslationConfigType,
  retrievedObjectTranslations: SourceComponent[] | undefined,
  activatedLanguages: string[]
): Promise<void> {
  const projectPath = options.projectPath;
  const projectPackDir = options.projectPackDir;
  const defaultPackDir = projectPackDir.find((packDir) => packDir.default);
  const defaultProjectSourcePath = path.join(defaultPackDir?.fullPath ?? '', 'main', 'default');

  if (!config.sObjects) {
    return;
  }

  for (const sObjConf of config.sObjects) {
    if (
      sObjConf.fields?.allTranslations === true ||
      (sObjConf.fields?.translationsFor && sObjConf.fields.translationsFor.length > 0)
    ) {
      for (const lang of activatedLanguages) {
        // Get all retreived translations for this sObject and language
        let retrievedsObjTrans: SourceComponent | undefined;
        if (retrievedObjectTranslations) {
          retrievedsObjTrans = retrievedObjectTranslations.find(
            (trans) => trans.fullName === `${sObjConf.apiName}-${lang}`
          );
        }
        const destDir = path.join(
          defaultProjectSourcePath,
          registry.types.customobjecttranslation.directoryName,
          `${sObjConf.apiName}-${lang}`
        );
        if (retrievedsObjTrans) {
          // Get all Field Translations for this sObject and language
          const retrievedFieldTrans = retrievedsObjTrans.getChildren();
          const fieldTranslationEnding = `.${registry.types.customobjecttranslation.children?.types.customfieldtranslation.suffix}-meta.xml`;

          if (sObjConf.fields.allTranslations) {
            // deleting existing translations
            let translationList = await getAllFilesByEnding(destDir, fieldTranslationEnding);
            try {
              await deleteFiles(destDir, translationList);
            } catch {
              // try another time if it failed the first time
              await deleteFiles(destDir, translationList);
            }

            // Build the source path
            const sourceDir = path.join(
              projectPath,
              workingDirName,
              tempProjectDirName,
              'main',
              'default',
              registry.types.customobjecttranslation.directoryName,
              `${sObjConf.apiName}-${lang}`
            );

            // copying fresh translations
            translationList = await getAllFilesByEnding(sourceDir, fieldTranslationEnding);
            try {
              await copyFiles(sourceDir, destDir, translationList);
            } catch {
              // try another time if it failed the first time
              await copyFiles(sourceDir, destDir, translationList);
            }
          } // { sObjConf.fieldsTranslationsFor && sObjConf.fieldsTranslationsFor.length > 0
          else if (sObjConf.fields.translationsFor) {
            for (const fieldAPIName of sObjConf.fields.translationsFor) {
              const retrievedTrans = retrievedFieldTrans.find((rft) => rft.name === fieldAPIName);
              // Build the destination path
              const destPath = path.join(destDir, `${fieldAPIName}${fieldTranslationEnding}`);

              if (retrievedTrans) {
                await copyFile(retrievedTrans.xml ?? '', destPath);
              } else {
                await deleteFile(destPath);
              }
            }
          }
        } else {
          // sObject does not exist anymore, so delete its translations
          await deleteDirRecursive(destDir);
        }
      }
    }
  }
  return;
};

// eslint-disable-next-line complexity
const updateObjectTranslationsFile = async function (
  options: UpdaterOptionsType,
  config: TranslationConfigType,
  localObjectTranslations: SourceComponent[] | undefined,
  retrievedObjectTranslations: SourceComponent[] | undefined,
  activatedLanguages: string[] | undefined
): Promise<void> {
  if (!activatedLanguages) {
    throw new Error('error in updateObjectTranslationsFile : activatedLanguages is mandatory');
  }
  // const projectPath = options.projectPath;
  const projectPackDir = options.projectPackDir;
  const defaultPackDir = projectPackDir.find((packDir) => packDir.default);
  const defaultProjectPath = path.join(defaultPackDir?.fullPath ?? '', 'main', 'default');

  for (const sObjConf of config.sObjects ?? []) {
    if (sObjConf.retrieveObjectRenameTranslations) {
      await updateGenericObjectTranslations<ObjectNameCaseValue>(
        { allTranslations: true },
        sObjConf.apiName,
        'caseValues',
        undefined,
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.layouts?.allTranslations === true ||
      (sObjConf.layouts?.translationsFor && sObjConf.layouts.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<LayoutTranslation>(
        sObjConf.layouts,
        sObjConf.apiName,
        'layouts',
        'layout',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.fieldSets?.allTranslations === true ||
      (sObjConf.fieldSets?.translationsFor && sObjConf.fieldSets.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<FieldSetTranslation>(
        sObjConf.fieldSets,
        sObjConf.apiName,
        'fieldSets',
        'name',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.quickActions?.allTranslations === true ||
      (sObjConf.quickActions?.translationsFor && sObjConf.quickActions.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<QuickActionTranslation>(
        sObjConf.quickActions,
        sObjConf.apiName,
        'quickActions',
        'name',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.recordTypes?.allTranslations === true ||
      (sObjConf.recordTypes?.translationsFor && sObjConf.recordTypes.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<RecordTypeTranslation>(
        sObjConf.recordTypes,
        sObjConf.apiName,
        'recordTypes',
        'name',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.sharingReasons?.allTranslations === true ||
      (sObjConf.sharingReasons?.translationsFor && sObjConf.sharingReasons.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<SharingReasonTranslation>(
        sObjConf.sharingReasons,
        sObjConf.apiName,
        'sharingReasons',
        'name',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.validationRules?.allTranslations === true ||
      (sObjConf.validationRules?.translationsFor && sObjConf.validationRules.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<ValidationRuleTranslation>(
        sObjConf.validationRules,
        sObjConf.apiName,
        'validationRules',
        'name',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.webLinks?.allTranslations === true ||
      (sObjConf.webLinks?.translationsFor && sObjConf.webLinks.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<WebLinkTranslation>(
        sObjConf.webLinks,
        sObjConf.apiName,
        'webLinks',
        'name',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
    if (
      sObjConf.workflowTasks?.allTranslations === true ||
      (sObjConf.workflowTasks?.translationsFor && sObjConf.workflowTasks.translationsFor.length > 0)
    ) {
      await updateGenericObjectTranslations<WorkflowTaskTranslation>(
        sObjConf.workflowTasks,
        sObjConf.apiName,
        'workflowTasks',
        'name',
        localObjectTranslations,
        retrievedObjectTranslations,
        activatedLanguages,
        defaultProjectPath
      );
    }
  }
  for (const filePath of objTransJSONModified) {
    const localsObjTransJSON = objTransJSON[filePath];
    localsObjTransJSON.CustomObjectTranslation = utils.sortObjTranslation(localsObjTransJSON.CustomObjectTranslation);
    await utils.writeXml(filePath, localsObjTransJSON);
  }
  return;
};

// eslint-disable-next-line complexity
const updateGenericObjectTranslations = async function <T extends sObjectTransArrayTypes>(
  genericConfig: GenericTransConfigType,
  sObjAPIName: string,
  translationType: sObjectTransKeySubset,
  translationTypeKey: string | undefined,
  localObjectTranslations: SourceComponent[] | undefined,
  retrievedObjectTranslations: SourceComponent[] | undefined,
  activatedLanguages: string[],
  defaultProjectPath: string
): Promise<void> {
  if (genericConfig.allTranslations) {
    for (const lang of activatedLanguages) {
      // Get all retreived translations for this sObject and language
      const retrievedsObjTrans = retrievedObjectTranslations?.find(
        (trans) => trans.fullName === `${sObjAPIName}-${lang}`
      );
      const destDir = path.join(
        defaultProjectPath,
        registry.types.customobjecttranslation.directoryName,
        `${sObjAPIName}-${lang}`
      );
      if (retrievedsObjTrans) {
        // Get translation files Path
        const retrievedObjectTransFilePath = retrievedsObjTrans.xml;
        const localObjectTransFilePath = path.join(
          destDir,
          `${sObjAPIName}-${lang}.${registry.types.customobjecttranslation.suffix}-meta.xml`
        );

        if (!fs.existsSync(localObjectTransFilePath)) {
          // No actual translation for this sObjet, so copy the retrieved one
          await copyFile(retrievedObjectTransFilePath, localObjectTransFilePath);
        } else {
          const retrievedObjectTranslation = await getOjectTranslationJSON(retrievedObjectTransFilePath);
          const localObjectTranslation = await getOjectTranslationJSON(localObjectTransFilePath);
          if (localObjectTranslation.CustomObjectTranslation) {
            // localObjectTranslation.CustomObjectTranslation[translationType] = retrievedObjectTranslation.CustomObjectTranslation?.[translationType];
            localObjectTranslation.CustomObjectTranslation = {
              ...localObjectTranslation.CustomObjectTranslation,
              [translationType]: retrievedObjectTranslation.CustomObjectTranslation?.[translationType],
            };
            objTransJSONModified.add(localObjectTransFilePath);
          }
        }
      } else {
        // sObject does not exist anymore, so delete its translations
        await deleteDirRecursive(destDir);
      }
    }
  } else if (genericConfig.translationsFor && genericConfig.translationsFor.length > 0) {
    for (const lang of activatedLanguages) {
      // Get all retreived translations for this sObject and language
      const localsObjTransSC = localObjectTranslations?.find((trans) => trans.fullName === `${sObjAPIName}-${lang}`);
      const retrievedsObjTransSC = retrievedObjectTranslations?.find(
        (trans) => trans.fullName === `${sObjAPIName}-${lang}`
      );

      const isExistingTrans = !!localsObjTransSC?.xml && fs.existsSync(localsObjTransSC.xml);
      const isRetrievedTrans = !!retrievedsObjTransSC?.xml && fs.existsSync(retrievedsObjTransSC.xml);

      const destDir = path.join(
        defaultProjectPath,
        registry.types.customobjecttranslation.directoryName,
        `${sObjAPIName}-${lang}`
      );

      if (!isExistingTrans && !isRetrievedTrans) {
        // No existing nor retrieved translation for this sObject & language
        continue;
      } else if (!isExistingTrans && isRetrievedTrans) {
        // No existing translation : copying whole retrieved one
        const destTransPath = path.join(
          destDir,
          `${sObjAPIName}-${lang}.${registry.types.customobjecttranslation.suffix}-meta.xml`
        );
        await copyFile(retrievedsObjTransSC.xml, destTransPath);
      } else if (isExistingTrans && !isRetrievedTrans) {
        // Existing translation found but no retrieved one : deleting local one
        await deleteDirRecursive(destDir);
      } else {
        if (!localsObjTransSC?.xml) {
          throw new Error('error in updateGenericObjectTranslations : localsObjTransSC should not be null');
        }
        if (!retrievedsObjTransSC?.xml) {
          throw new Error('error in updateGenericObjectTranslations : retrievedsObjTransSC should not be null');
        }
        // Existing & retrieved translations exist : updating local one
        const localsObjTransJSON = await getOjectTranslationJSON(localsObjTransSC.xml);
        const retrievedsObjTransJSON = await getOjectTranslationJSON(retrievedsObjTransSC.xml);

        let allLocalGenericTrans = localsObjTransJSON?.CustomObjectTranslation?.[translationType] as T[];
        const allRetrievedGenericTrans = retrievedsObjTransJSON?.CustomObjectTranslation?.[translationType] as T[];

        // remove existing translations
        allLocalGenericTrans = allLocalGenericTrans?.filter(
          (gt) => !genericConfig?.translationsFor?.includes(gt[translationTypeKey as keyof sObjectTransArrayTypes][0])
        );

        const retrievedGenericTrans = allRetrievedGenericTrans?.filter((gt) =>
          genericConfig?.translationsFor?.includes(gt[translationTypeKey as keyof sObjectTransArrayTypes][0])
        );
        allLocalGenericTrans.push(...retrievedGenericTrans);

        (localsObjTransJSON.CustomObjectTranslation[translationType] as T[]) = allLocalGenericTrans;

        objTransJSONModified.add(localsObjTransSC.xml);
      }
    }
  }
};

// eslint-disable-next-line complexity
const updateTranslations = async function (
  options: UpdaterOptionsType,
  config: TranslationConfigType,
  localTranslations: SourceComponent[] | undefined,
  retrievedTranslations: SourceComponent[] | undefined,
  activatedLanguages: string[]
): Promise<void> {
  const projectPackDir = options.projectPackDir;
  const defaultPackDir = projectPackDir.find((packDir) => packDir.default);
  if (!defaultPackDir) {
    throw new Error('error in updateTranslations : defaultPackDir should not be null');
  }
  const defaultProjectPath = path.join(defaultPackDir.fullPath, 'main', 'default');
  const destDir = path.join(defaultProjectPath, registry.types.translations.directoryName);

  if (config.isCustomApplicationTranslations && !!config.customApplications) {
    await updateGenericTranslations(
      config.customApplications,
      'customApplications',
      'name',
      localTranslations,
      retrievedTranslations,
      activatedLanguages,
      destDir
    );
  }

  if (config.isCustomLabelTranslations && !!config.customLabels) {
    await updateGenericTranslations(
      config.customLabels,
      'customLabels',
      'name',
      localTranslations,
      retrievedTranslations,
      activatedLanguages,
      destDir
    );
  }

  if (config.isFlowTranslations && !!config.flows) {
    await updateGenericTranslations(
      config.flows,
      'flowDefinitions',
      'fullName',
      localTranslations,
      retrievedTranslations,
      activatedLanguages,
      destDir
    );
  }

  if (config.isGlobalQuickActionTranslations && !!config.globalQuickActions) {
    await updateGenericTranslations(
      config.globalQuickActions,
      'quickActions',
      'name',
      localTranslations,
      retrievedTranslations,
      activatedLanguages,
      destDir
    );
  }

  if (config.isReportTypeTranslations && !!config.reportTypes) {
    await updateGenericTranslations(
      config.reportTypes,
      'reportTypes',
      'name',
      localTranslations,
      retrievedTranslations,
      activatedLanguages,
      destDir
    );
  }

  for (const filePath of transJSONModified) {
    const localTransJSON = transJSON[filePath];
    localTransJSON.Translations = utils.sortTranslation(localTransJSON.Translations);
    await utils.writeXml(filePath, localTransJSON);
  }
  return;
};

// eslint-disable-next-line complexity
const updateGenericTranslations = async function <T extends TransArrayTypes>(
  genericConfig: GenericTransConfigType,
  translationType: TransKeySubset,
  translationTypeKey: string,
  localTranslations: SourceComponent[] | undefined,
  retrievedTranslations: SourceComponent[] | undefined,
  activatedLanguages: string[],
  destDir: string
): Promise<void> {
  if (genericConfig.allTranslations) {
    for (const lang of activatedLanguages) {
      // Get all retreived translations for this language
      let retrievedTrans: SourceComponent | undefined;
      if (retrievedTranslations) {
        retrievedTrans = retrievedTranslations.find((trans) => trans.fullName === lang);
      }
      const retrievedTransFilePath = retrievedTrans?.xml;
      const fileName = retrievedTransFilePath ? path.basename(retrievedTransFilePath) : undefined;
      const localTransFilePath = fileName ? path.join(destDir, fileName) : undefined;

      if (retrievedTrans) {
        // Get translation files Path
        if (localTransFilePath && !fs.existsSync(localTransFilePath)) {
          // No local translation for this language, so copy the retrieved one
          await copyFile(retrievedTransFilePath, localTransFilePath);
        } else {
          const retrievedTranslation = await getTranslationJSON(retrievedTransFilePath);
          const localTranslation = await getTranslationJSON(localTransFilePath);
          (localTranslation.Translations[translationType] as T[]) = retrievedTranslation.Translations[
            translationType
          ] as T[];
          if (localTransFilePath) {
            transJSONModified.add(localTransFilePath);
          }
        }
      } else {
        // translation does not exist anymore, so delete its translations
        await deleteFile(localTransFilePath);
      }
    }
  } else if (genericConfig.translationsFor && genericConfig.translationsFor.length > 0) {
    for (const lang of activatedLanguages) {
      // Get all retreived translations for this language
      let localTransSC: SourceComponent | undefined;
      if (localTranslations) {
        localTransSC = localTranslations.find((trans) => trans.fullName === lang);
      }
      let retrievedTransSC: SourceComponent | undefined;
      if (retrievedTranslations) {
        retrievedTransSC = retrievedTranslations.find((trans) => trans.fullName === lang);
      }
      let localTransFilePath = localTransSC?.xml;
      const retrievedTransFilePath = retrievedTransSC?.xml;

      const isExistingTrans = !!localTransSC?.xml && fs.existsSync(localTransSC.xml);
      const isRetrievedTrans = !!retrievedTransSC?.xml && fs.existsSync(retrievedTransSC.xml);

      if (!isExistingTrans && !isRetrievedTrans) {
        // No existing nor retrieved translation for this sObject & language
        continue;
      } else if (!isExistingTrans && isRetrievedTrans && !!retrievedTransFilePath) {
        // No existing translation : copying whole retrieved one
        const fileName = path.basename(retrievedTransFilePath);
        localTransFilePath = path.join(destDir, fileName);
        await copyFile(retrievedTransFilePath, localTransFilePath);
      } else if (isExistingTrans && !isRetrievedTrans && !!localTransFilePath) {
        // Existing translation found but no retrieved one : deleting local one
        await deleteFile(localTransFilePath);
      } else {
        if (!localTransFilePath) {
          throw new Error('error in updateGenericTranslations : localTransFilePath should not be null');
        }
        if (!retrievedTransFilePath) {
          throw new Error('error in updateGenericTranslations : retrievedTransFilePath should not be null');
        }
        // Existing & retrieved translations exist : updating local one
        const localTransJSON = await getTranslationJSON(localTransFilePath);
        const retrievedTransJSON = await getTranslationJSON(retrievedTransFilePath);

        let allLocalGenericTrans = localTransJSON?.Translations?.[translationType] as T[];
        const allRetrievedGenericTrans = retrievedTransJSON?.Translations?.[translationType] as T[];

        // remove existing translations
        allLocalGenericTrans = allLocalGenericTrans?.filter(
          (gt) =>
            !genericConfig?.translationsFor?.includes(
              gt[translationTypeKey as keyof TransArrayTypes]?.[0] ?? 'key not found'
            )
        );

        const retrievedGenericTrans = allRetrievedGenericTrans?.filter((gt) =>
          genericConfig?.translationsFor?.includes(
            gt[translationTypeKey as keyof TransArrayTypes]?.[0] ?? 'key not found'
          )
        );
        if (retrievedGenericTrans) {
          allLocalGenericTrans.push(...retrievedGenericTrans);
        }

        (localTransJSON.Translations[translationType] as T[]) = allLocalGenericTrans;

        if (localTransSC?.xml) {
          transJSONModified.add(localTransSC.xml);
        }
      }
    }
  }
  return;
};

const getOjectTranslationJSON = async function (filePath?: string): Promise<ParsedCustomObjectTranslation> {
  if (!filePath) {
    throw new Error('error in getOjectTranslationJSON : filePath is mandatory');
  }
  if (!objTransJSON?.[filePath]) {
    objTransJSON[filePath] = (await utils.readXml(filePath)) as ParsedCustomObjectTranslation;
  }
  return objTransJSON[filePath];
};

const getTranslationJSON = async function (filePath?: string): Promise<ParsedTranslation> {
  if (!filePath) {
    throw new Error('error in getTranslationJSON : filePath is mandatory');
  }
  if (!transJSON?.[filePath]) {
    transJSON[filePath] = (await utils.readXml(filePath)) as ParsedTranslation;
  }
  return transJSON[filePath];
};

export { updateFieldTranslations, updateObjectTranslationsFile, updateTranslations };
