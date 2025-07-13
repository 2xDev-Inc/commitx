import inquirer from "inquirer";
import fs from "fs";
import os from "os";
import path from "path";

export const KEY_PATH = path.join(os.homedir(), ".ai-commit-gemini-key");

export const clearSavedApiKey = (): boolean => {
    try {
        if (fs.existsSync(KEY_PATH)) {
            fs.unlinkSync(KEY_PATH);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to clear API key:", error);
        return false;
    }
};

export default async (): Promise<string | null> => {
    if (fs.existsSync(KEY_PATH)) {
        const key = fs.readFileSync(KEY_PATH, "utf8").trim();
        if (key) return key;
    }
    const { apiKey } = await inquirer.prompt([
        {
            type: "password",
            name: "apiKey",
            message: "Enter your Gemini API key:",
            mask: "*",
            validate: (input: string) => input.trim() ? true : "API key cannot be empty"
        }
    ]);
    if (apiKey && apiKey.trim()) {
        fs.writeFileSync(KEY_PATH, apiKey.trim(), { mode: 0o600 });
        return apiKey.trim();
    }
    return null;
};
