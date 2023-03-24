import * as os from 'os';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { TranslationUpdater } from '../../../utils/translationUpdater';
import { UpdaterOptionsType, UpdateOutput } from '../../../utils/typeDefs';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@cgi-fr/salesforce-toolbox', 'translationUpdate');

export default class Update extends SfCommand<UpdateOutput> {
    public static description = messages.getMessage('commandDescription');
    public static examples = messages.getMessage('examples').split(os.EOL);

    public static flags = {
        'target-org': Flags.requiredOrg({
          char: 'o',
        }),
        config: Flags.file({
            char: 'c',
            description: messages.getMessage('configFlagDescription'),
        }),
    };

    public static requiresUsername = true;
    public static supportsDevhubUsername = true;
    public static requiresProject = true;

    public async run(): Promise<UpdateOutput> {
        const { flags } = await this.parse(Update);
        const org = flags['target-org'];
        const conn = org.getConnection();

        const options: UpdaterOptionsType = {
            configPath: flags.config,
            orgUsername: org.getUsername(),
            projectPath: this.project.getPath(),
            projectPackDir: this.project.getPackageDirectories(),
            apiVersion: await org.retrieveMaxApiVersion(),
            connection: conn,
            rootClass: this,
        }
        await TranslationUpdater.doUpdate(options);
        return { success: true };
    }
}
