import * as os from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { ProfileUpdater } from '../../../utils/profileUpdater';
import { ProfileUpdaterOptionsType } from '../../../utils/typeDefs';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@cgi-fr/salesforce-toolbox', 'profilePermissionsUpdate');

export default class Update extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');
    public static examples = messages.getMessage('examples').split(os.EOL);

    protected static flagsConfig: FlagsConfig = {
        config: flags.filepath({
            char: 'c',
            description: messages.getMessage('configFlagDescription'),
        }),
    };

    protected static requiresUsername = true;
    protected static supportsDevhubUsername = true;
    protected static requiresProject = true;

    public async run(): Promise<AnyJson> {
        const options: ProfileUpdaterOptionsType = {
            configPath: this.flags.config as string,
            orgUsername: this.org.getUsername(),
            projectPath: this.project.getPath(),
            projectPackDir: this.project.getPackageDirectories(),
            apiVersion: await this.org.retrieveMaxApiVersion(),
            connection: this.org.getConnection(),
        }
        await ProfileUpdater.doUpdate(options);
        return { success: true };
    }
}
