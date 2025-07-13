import { execa } from "execa";

export default async(checkCache?:boolean) => {
    const args = ["diff"];
    if (checkCache) {
        args.push("--cached");
    }
    const { stdout } = await execa("git", args);
    return stdout.trim();
}