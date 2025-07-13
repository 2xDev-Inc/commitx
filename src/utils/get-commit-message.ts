
export default async (diff: string, apiKey: string): Promise<string> => {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
    const prompt = `Generate a concise, conventional commit message based on this git diff:\n\n${diff}\n\nCommit message:`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }]
    };
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("Failed to get commit message from Gemini API");
    const data = await res.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Update code";
};
