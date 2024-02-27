# zGPT

A lightweight Typescript library for calling Large Language Models (LLMs) with type-safety.

## Example

```
const response = await zgpt.chat({
    messages: [
        {role: "system", content: "You are a sentiment classifier. Classify the sentiment of the user's messages."},
        {role: "user", content: "I love zGPT!" },
    ],

    tool: {
        name: "classify-sentiment",
        description: "Records the sentiment of a user's message."
        schema: z.object({
            message: z.string().describe("The user's message"),
            sentiment: z.enum(["positive", "negative"]).describe("The sentiment of the user's message.")
        })
    }
})

// typeof response = { role: "assistant"; content: string | null; calls: { message: string; sentiment: "positive" | "negative"; }; };
```
