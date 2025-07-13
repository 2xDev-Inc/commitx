#!/usr/bin/env node

import gitDiff from "./utils/git-diff";
import getGeminiApiKey, { clearSavedApiKey } from "./utils/get-gemini-api-key";
import getCommitMessage from "./utils/get-commit-message";
import gitCommit from "./utils/git-commit";
import gitPush from "./utils/git-push";
import { execa } from "execa";
import inquirer from "inquirer";
import ora from "ora";
import ansiEscapes from "ansi-escapes";
import chalk from "chalk";

const isGitRepo = async () => {
    try {
        await execa("git", ["rev-parse", "--is-inside-work-tree"]);
        return true;
    } catch {
        return false;
    }
};

const main = async () => {

    process.on("SIGINT", () => {
        process.stdout.write("\n");
        process.exit(0);
    });

    try {
        if (process.argv.includes('--clear')) {
            const cleared = clearSavedApiKey();
            if (cleared) {
                console.log(chalk.green("Gemini API key cleared successfully. You'll be prompted for a new key on the next run."));
            } else {
                console.log(chalk.yellow("No saved API key found."));
            }
            return;
        }

        const inGit = await isGitRepo();
        if (!inGit) {
            console.log(chalk.red("Not a git repository. Please run this inside a git project."));
            process.exit(1);
        }

        const checkCache = process.argv.includes('--cache');
        const diff = await gitDiff(checkCache);
        if (!diff) {
            console.log(chalk.yellow("No changes detected. Please make some changes before committing."));
            return;
        }

        const apiKey = await getGeminiApiKey();
        if (!apiKey) {
            console.log(chalk.red("Gemini API key not found. Please set it up."));
            process.exit(1);
        }

        let commitMsg = "";
        let done = false;

        const spinner = ora("Generating commit message...").start();
        try {
            commitMsg = await getCommitMessage(diff, apiKey);
        } finally {
            spinner.stop();
        }
        
        while (!done) {
            const { action } = await inquirer.prompt([
                {
                    type: "list",
                    name: "action",
                    message: `Suggested commit message:\n\n"${commitMsg}"\n\nWhat do you want to do?`,
                    choices: [
                        { name: "Commit", value: "commit" },
                        { name: "Regenerate", value: "regenerate" },
                        { name: "Exit", value: "exit" }
                    ]
                }
            ]);

            if (action === "commit") {
                await gitCommit(commitMsg);
                const { postCommit } = await inquirer.prompt([
                    {
                        type: "confirm",
                        name: "postCommit",
                        message: "Commit successful. Push to remote?",
                        default: true
                    }
                ]);
                if (postCommit) {
                    await gitPush();
                    console.log(chalk.green("Pushed to remote."));
                }
                console.log(chalk.green("Done."));
                done = true;

            } else if (action === "regenerate") {

                const termWidth = process.stdout.columns || 80;
                const promptMsg = `Suggested commit message:\n\n"${commitMsg}"\n\nWhat do you want to do?`;
                const promptMsgLines = promptMsg.split('\n').reduce((acc, line) => {
                    return acc + Math.ceil(line.length / termWidth) || 1;
                }, 0);

                const choicesLines = 3;
                const totalLines = promptMsgLines + choicesLines;

                process.stdout.write(ansiEscapes.eraseLines(totalLines));
                const spinner = ora("Regenerating commit message...").start();
                try {
                    commitMsg = await getCommitMessage(diff, apiKey);
                } finally {
                    spinner.stop();
                }
            } else {
                done = true;
            }
        }
    } catch (e: any) {
        if (e && e.name === "ExitPromptError") {
            process.exit(0);
        }
        console.error(chalk.red("An error occurred:"), e);
        process.exit(1);
    }
};

main();