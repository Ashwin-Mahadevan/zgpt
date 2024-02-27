import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export function zodToOpenAISchema<T extends z.ZodType>(schema: T) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { $schema, ...json } = zodToJsonSchema(schema);
	return json;
}
