# zGPT

A lightweight Typescript library for calling Large Language Models (LLMs) with type-safety.

```
import { zgpt } from "zgpt";

const message = zgpt({
    messages: [
        { role: "system", content: "You are a sentiment analyzer Classify each sentence from the user." },
        { role: "user", content: "I love zGPT!" },
    ],
    tool: {
            name: "classify-sentiment",
            description: "Classifies a sentence as positive or negative.",
            schema: z.object({ sentence: z.string(), sentiment: z.enum(["positive", "negative"]) })
    },
})

typeof message  // {
                //      role: "assistant",
                //      content: null,
                //      calls: { id: string; arguments: { sentence: string; sentiment: "positive" | "negative" } }[]
                // }
```
