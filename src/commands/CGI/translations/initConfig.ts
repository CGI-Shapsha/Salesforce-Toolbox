/**
 * @description Entry point for translation update config file initialization
 * @author Philippe Planchon <planchon.phil@gmail.com>
 */
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { startTranslationInit } from '../../../utils/dirManagment.js';
import { InitConfigOutput } from '../../../utils/typeDefs.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@cgi-fr/salesforce-toolbox', 'CGI.translations.initConfig');

export default class InitConfig extends SfCommand<InitConfigOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;

  public async run(): Promise<InitConfigOutput> {
    this.styledHeader('Generating Config File for Translations Update job');
    const configFilePath: string = await startTranslationInit(this.project?.getPath());
    this.log(`Config File created here : ${configFilePath}`);
    this.log('Edit it before launching translation update job !\n');

    return { path: configFilePath };
  }
}
