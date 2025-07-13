import { execa } from "execa";

export default async () => {
    await execa("git", ["push"]);
};
