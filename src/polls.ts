import { InviteGuild, Message, EmbedBuilder, TextChannel, User } from "discord.js";
import * as Main from "./main";
import * as Utilities from "./utilities"
import * as Youtube from "./youtube"

export class Poll {
    id: number;
    message: Message;
    name = "Unnamed poll";
    options: PollOption[] = [];
    totalVotes = 0;

    constructor(name: string) {
        if (name && name != null)
            this.name = name;
        Poll.list.push(this);
    }
    generateMessage() {
        let embed = new EmbedBuilder().setColor([24, 195, 177]).setTitle(this.name)
        let description = "";
        /*for (const option of this.options) {
            newMessage += "\n`" + (option.index + 1) + "`: " + option.name
        }*/
        if (this.options.length == 0) description += "No options yet";
        if (this.options.length < 9) embed.setFooter({ text: "Reply to this message to add custom options" });
        for (const option of this.options) {
            let votes = option.votes.length;
            let percentage = Math.round((votes / (this.totalVotes || 1) * 100));
            description += "\n" + Main.letterEmoji[(option.index + 1).toString()] + " " + Youtube.progressEmoji(Math.round(percentage / 25)) + " **" + option.name + "** (" + votes + " votes - " + percentage + "%)"
        }
        embed.setDescription(description);
        return { embeds: [embed] };
    }
    updateMessage() {
        this.message.edit(this.generateMessage());
    }
    async sendMessage(channel: TextChannel) {
        this.message = await channel.send(this.generateMessage());
        for (let i = 1; i <= this.options.length && i <= 9; i++) {
            this.message.react(Main.letterEmoji[i.toString()]);
        }
        return this.message;
    }
    addOption(name: string) {
        if (this.options.length >= 9) throw new Error("Options limit reached");
        if (this.options.some(option => option.name == name)) throw new Error("Option already exists");
        let newOption = new PollOption(this, this.options.length, name);
        this.options.push(newOption);
        if (this.message != undefined) {
            this.updateMessage();
            this.message.react(Main.letterEmoji[this.options.length.toString()]);
        }
        console.log(`Added option to poll "${this.name}" with name ${name}`);
    }
    addVote(optionIndex: number, userId: string) {
        if (optionIndex < this.options.length && optionIndex >= 0) {
            this.options[optionIndex].votes.push(new PollVote(this, optionIndex, userId));
            this.totalVotes++;
            this.updateMessage();
            console.log(`Added vote to poll "${this.name}" from user ${userId} for option ${optionIndex}`);
        }
    }
    removeVote(optionIndex: number, userId: string) {
        if (optionIndex < this.options.length && optionIndex >= 0) {
            for (let i = 0; i < this.options[optionIndex].votes.length; i++) {
                const vote = this.options[optionIndex].votes[i];
                if (vote.userId == userId) {
                    this.options[optionIndex].votes.splice(i, 1);
                    this.totalVotes--;
                    this.updateMessage();
                    break;
                }
            }
        }
        console.log(`Removed vote from poll "${this.name}" from user ${userId} for option ${optionIndex}`);
    }


    static list = [];
    static getPollFromMessage(message: Message) {
        return Poll.list.find(element => { return element.message === message });
    }
}

export class PollOption {
    index: number;
    name: string;
    poll: Poll;
    votes: PollVote[];
    constructor(poll: Poll, index: number, name: string) {
        this.index = index;
        this.name = name;
        this.poll = poll;
    }
}

export class PollVote {
    option: PollOption;
    userId: string;
    poll: Poll;
    constructor(poll: Poll, optionIndex: number, userId: string) {
        this.poll = poll;
        this.option = this.poll.options[optionIndex];
        this.userId = userId;
    }
}