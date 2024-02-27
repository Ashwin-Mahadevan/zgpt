# zGPT

A lightweight Typescript library for calling Large Language Models (LLMs) with type-safety.

## Example

```ts
const exampleMessage = await zgpt.chat({
	messages: [
		{ role: "system", content: "You are a sentiment classifier." },
		{ role: "system", content: "Classify the user's messages." },
		{ role: "user", content: "I love zGPT!" },
	],

	tool: {
		name: "classify-sentiment",
		description: "Records the sentiment of a user's message.",
		schema: z.object({
			message: z.string().describe("The user's message."),
			sentiment: z
				.enum(["positive", "negative"])
				.describe("The sentiment of the user's message."),
		}),
	},
});

// You don't need to define this type; this is what's returned from above.
type ExampleMessage = {
	role: "assistant";
	content: string | null;
	calls: {
		message: string;
		sentiment: "positive" | "negative";
	};
};
```
