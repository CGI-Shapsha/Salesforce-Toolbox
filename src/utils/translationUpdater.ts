/**
 * @description main process for translation update
 * @author Philippe Planchon <planchon.phil@gmail.com>
 */
/* eslint-disable no-await-in-loop */
import * as path from 'node:path';
import { SfError } from '@salesforce/core';
import { Spinner } from '@salesforce/sf-plugins-core';
import { registry, SourceComponent } from '@salesforce/source-deploy-retrieve';
import * as utils from './utils.js';
import * as translationsHelper from './translationsHelper.js';
import { translationConfigFileName, manifestFileName, tempProjectDirName, workingDirName } from './constants.js';
import { checkWorkingDir, deleteDirRecursive } from './dirManagment.js';
import { UpdaterOptionsType } from './typeDefs.js';

export class TranslationUpdater {
  // eslint-disable-next-line complexity
  public static async doUpdate(options: UpdaterOptionsType): Promise<void> {
    let configPath = options.configPath;
    const orgUsername = options.orgUsername;
    const projectPath = options.projectPath;
    const projectPackDir = options.projectPackDir;
    const apiVersion = options.apiVersion;
    const tempProjectPath = path.join(projectPath, workingDirName, tempProjectDirName);

    if (!configPath) {
      configPath = path.join(projectPath, workingDirName, translationConfigFileName);
    }
    const config = await utils.getTranslationConfig(configPath);
    if (!config) {
      return;
    }

    options.rootClass.styledHeader('Generating Manifest File');
    options.rootClass.spinner = new Spinner(true);
    options.rootClass.spinner.start('Generating Manifest', 'In progress');

    const workingDirPath = await checkWorkingDir(projectPath);

    const activatedLanguages = (await utils.getMetadataList(options.connection, registry.types.translations.name)).map(
      (l) => l.fullName
    );

    const { manifestFilePath, sObjectTranslationSet } = await utils.generateTranslationManifest(
      config,
      apiVersion,
      workingDirPath,
      manifestFileName,
      activatedLanguages,
      options.connection
    );
    options.rootClass.spinner.stop('✔️\n');

    options.rootClass.styledHeader(`Retreiving Metadata from Salesforce Org using : ${orgUsername}`);
    await utils.retreiveFromManifest(manifestFilePath, tempProjectPath, orgUsername, options.rootClass, 'translations');

    const isObjectTranslations =
      config.isRenameTranslations ||
      config.isLayoutTranslations ||
      config.isFieldSetTranslations ||
      config.isQuickActionTranslations ||
      config.isRecordTypeTranslations ||
      config.isSharingReasonTranslations ||
      config.isValidationRuleTranslations ||
      config.isWebLinkTranslations ||
      config.isWorkflowTaskTranslations;
    const isObjectTranslationsWithNamedItems =
      config.isLayoutTranslationsWithNamedItems ||
      config.isFieldSetTranslationsWithNamedItems ||
      config.isQuickActionTranslationsWithNamedItems ||
      config.isRecordTypeTranslationsWithNamedItems ||
      config.isSharingReasonTranslationsWithNamedItems ||
      config.isValidationRuleTranslationsWithNamedItems ||
      config.isWebLinkTranslationsWithNamedItems ||
      config.isWorkflowTaskTranslationsWithNamedItems;
    const isTranslations =
      config.isCustomApplicationTranslations ||
      config.isCustomLabelTranslations ||
      config.isCustomTabTranslations ||
      config.isFlowTranslations ||
      config.isGlobalQuickActionTranslations ||
      config.isReportTypeTranslations;
    const isTranslationsWithNamedItems =
      config.isCustomApplicationTranslationsWithNamedItems ||
      config.isCustomLabelTranslationsWithNamedItems ||
      config.isCustomTabTranslationsWithNamedItems ||
      config.isFlowTranslationsWithNamedItems ||
      config.isGlobalQuickActionTranslationsWithNamedItems ||
      config.isReportTypeTranslationsWithNamedItems;

    options.rootClass.styledHeader('Updating local translations');
    options.rootClass.spinner = new Spinner(true);
    options.rootClass.spinner.start('Initializing Update', 'In progress');

    let retrievedTranslations: SourceComponent[] | undefined;
    if (config.isFieldTranslations || isObjectTranslations || isTranslations) {
      retrievedTranslations = utils.loadTranslationsFromPackageDirectories(
        projectPath,
        sObjectTranslationSet,
        isTranslations,
        undefined,
        [path.join(workingDirName, tempProjectDirName)]
      );
    } else {
      retrievedTranslations = undefined;
    }

    let existingTranslations: SourceComponent[] | undefined;
    if (isObjectTranslationsWithNamedItems || isTranslationsWithNamedItems) {
      existingTranslations = utils.loadTranslationsFromPackageDirectories(
        projectPath,
        sObjectTranslationSet,
        isTranslationsWithNamedItems,
        projectPackDir
      );
    } else {
      existingTranslations = undefined;
    }

    options.rootClass.spinner.stop('✔️\n');

    options.rootClass.log('Updating local translations :');

    // objectTranslations files
    if (isObjectTranslations) {
      options.rootClass.spinner = new Spinner(true);
      options.rootClass.spinner.start('Updating "objectTranslation-meta.xml" files', 'In progress');
      await translationsHelper.updateObjectTranslationsFile(
        options,
        config,
        existingTranslations,
        retrievedTranslations,
        activatedLanguages
      );
      options.rootClass.spinner.stop('✔️');
    }

    // fieldtranslations files
    if (config.isFieldTranslations) {
      options.rootClass.spinner = new Spinner(true);
      options.rootClass.spinner.start('Updating "fieldTranslation-meta.xml" files', 'In progress');
      await translationsHelper.updateFieldTranslations(options, config, retrievedTranslations, activatedLanguages);
      options.rootClass.spinner.stop('✔️');
    }

    // translations files
    if (isTranslations) {
      options.rootClass.spinner = new Spinner(true);
      options.rootClass.spinner.start('Updating "translation-meta.xml" files', 'In progress');
      await translationsHelper.updateTranslations(
        options,
        config,
        existingTranslations,
        retrievedTranslations,
        activatedLanguages
      );
      options.rootClass.spinner.stop('✔️');
    }

    options.rootClass.log('');
    options.rootClass.log('All local translations successfully updated ! ✔️\n');

    // Cleaning temp project
    options.rootClass.styledHeader('Cleaning working directory');
    options.rootClass.spinner = new Spinner(true);
    options.rootClass.spinner.start('Cleaning', 'In progress');
    try {
      await deleteDirRecursive(tempProjectPath);
      options.rootClass.spinner.stop('✔️\n');
    } catch {
      options.rootClass.spinner.stop('❌\n');
      throw new SfError(
        `An error occured during WorkingDirectory cleaning. Please delete this folder if you don't need it : ${tempProjectPath}`
      );
    }
    return;
  }
}
