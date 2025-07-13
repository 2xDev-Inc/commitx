import { execa } from "execa";

export default async (message: string) => {
    await execa("git", ["add", "."]);
    await execa("git", ["commit", "-m", message]);
};
