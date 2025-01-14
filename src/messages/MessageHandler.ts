import DiscordClient from '../DiscordClient';
import {
  ApplicationCommand,
  ApplicationCommandData,
  GuildResolvable,
  Message,
  Role,
} from 'discord.js';
import PingCommand from './PingCommand';
import ByeCommand from './ByeCommand';
import LinkCommand from './LinkCommand';
import HelpCommand from './HelpCommand';
import StreamerCommand from './StreamerCommand';
import DeployCommand from './DeployCommand';
import LinkResolve from './LinkResolve';
import Command from './Command';
import CommandPermissions from './CommandPermissions';
import Settings from '../Settings';

export type ApplicationCommandType = ApplicationCommand<{
  guild: GuildResolvable;
}>;
export interface CommandHandler {
  command: string | string[];
  handler: Command;
}

export default class MessageHandler {
  static _commands: Command[] = [
    new PingCommand(),
    new ByeCommand(),
    new LinkCommand(),
    new StreamerCommand(),
    new HelpCommand(),
    new DeployCommand(),
  ];

  constructor() {
    DiscordClient._client.on('messageCreate', this.onMessage.bind(this));
  }

  public static addCommands(): void {
    (
      MessageHandler._commands.find(
        (command: Command) => command.deploy.name === 'help'
      ) as HelpCommand
    ).loadHelp();
    const guildCommands: ApplicationCommandData[] = MessageHandler._commands
      .filter((command: Command): boolean => command.guildOnly)
      .map((command: Command): ApplicationCommandData => command.deploy);

    const dmCommands: ApplicationCommandData[] = MessageHandler._commands
      .filter((command: Command): boolean => !command.guildOnly)
      .map((command: Command): ApplicationCommandData => command.deploy);

    DiscordClient._client.application?.commands.set(dmCommands);

    for (const guild of DiscordClient._client.guilds.cache.toJSON()) {
      guild.commands
        .fetch()
        .then((): void => {
          const commandPermissions: CommandPermissions = new CommandPermissions(
            guild
          );
          guild.commands
            .set(guildCommands)
            .then(commandPermissions.onCommandsSet.bind(commandPermissions))
            .catch(console.error);
        })
        .catch(console.error);
    }
  }

  

  onMessage(message: Message) {
    if (message.channel.type === 'DM' || message.author.bot) return;
    if (message.content.match(/https:\/\/discord(app)?\.(com|gg)\/channels/))
      new LinkResolve().handleCommand(message.channel, message);

    if (message.content === '!deploy') {
      if (
        !message.member!.roles.cache.find((role: Role): boolean =>
          Settings.getSettings()['permission-roles'].includes(role.name)
        )
      ) {
        message
          .reply({
            content: 'You do not have the permission to perform this command',
            allowedMentions: { repliedUser: false },
          })
          .catch(console.error);
        return;
      }
      MessageHandler.addCommands();
      message
        .reply({
          content: 'Commands deployed',
          allowedMentions: { repliedUser: false },
        })
        .catch(console.error);
    }
  }
}
