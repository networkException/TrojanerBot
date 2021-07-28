import {
  ApplicationCommand,
  ApplicationCommandData,
  ClientApplication,
  Collection,
  CommandInteractionOption,
  GuildResolvable,
  Interaction,
  Snowflake,
} from 'discord.js';
import DiscordClient from '../DiscordClient';
import PermissionManager from '../PermissionManager';
import Command, { DeploymentOptions, Reply } from './Command';
import MessageHandler from './MessageHandler';

export default class DeployCommand extends Command {
  deploy: ApplicationCommandData = {
    name: 'deploy',
    description: 'Deploys the custom commands',
    options: [
      {
        type: 1,
        name: 'all',
        description: 'Deploys the custom commands',
        options: [],
      },
      {
        type: 1,
        name: 'remove',
        description: 'Removes the deployed commands',
        options: [],
      },
    ],
  };

  deploymentOptions: DeploymentOptions = ['guilds'];

  handleCommand(
    args: CommandInteractionOption[],
    interaction: Interaction
  ): Reply {
    if (
      !PermissionManager.hasPermission(
        interaction.guild!,
        interaction.member?.roles
      )
    )
      return { reply: PermissionManager._errorMessage, ephemeral: true };
    switch (args[0].name) {
      case 'all':
        MessageHandler.addCommands();
        return { reply: 'All commands have been added', ephemeral: true };
      case 'remove':
        DiscordClient._client.application?.commands
          .fetch()
          .then(this.commandsFetched);

        for (const guild of DiscordClient._client.guilds.cache.array())
          guild.commands.fetch().then(this.commandsFetched);
        return { reply: 'All commands have been removed', ephemeral: true };
      default:
        return { reply: 'Something went wrong', ephemeral: true };
    }
  }

  private commandsFetched(
    commands: Collection<
      Snowflake,
      ApplicationCommand<{ guild: GuildResolvable }>
    >
  ) {
    for (const command of commands.array().filter((command) => command.name !== 'deploy'))
      command.delete().catch(console.error);
  }
}