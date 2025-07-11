/**
 * @description Entry point for profiles update action
 * @author Philippe Planchon <planchon.phil@gmail.com>
 */
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, SfError, Org } from '@salesforce/core';
import { ProfileUpdater } from '../../../utils/profileUpdater.js';
import { UpdaterOptionsType, UpdateOutput } from '../../../utils/typeDefs.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@cgi-fr/salesforce-toolbox', 'CGI.profiles.update');

export default class Update extends SfCommand<UpdateOutput> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly requiresProject = true;

  public static readonly flags = {
    'target-org': Flags.requiredOrg(),
    config: Flags.file({
      char: 'c',
      summary: messages.getMessage('flags.config.summary'),
      description: messages.getMessage('flags.config.description'),
    }),
  };

  public async run(): Promise<UpdateOutput> {
    const { flags } = await this.parse(Update);
    const org: Org = flags['target-org'];
    const maxApiVersion = await org.retrieveMaxApiVersion();
    const conn = org.getConnection(maxApiVersion);

    const orgUsername = org.getUsername();
    const projectPath = this.project?.getPath();
    const projectPackDir = this.project?.getPackageDirectories() ? this.project.getPackageDirectories() : [];
    if (!orgUsername) {
      throw new SfError('An error occured : this command required a Salesforce connection');
    }
    if (!projectPath) {
      throw new SfError('An error occured : this command required a SF / SDFX Project');
    }

    const options: UpdaterOptionsType = {
      configPath: flags.config as string,
      orgUsername,
      projectPath,
      projectPackDir,
      apiVersion: maxApiVersion,
      connection: conn,
      rootClass: this,
    };
    await ProfileUpdater.doUpdate(options);
    return { success: true };
  }
}
