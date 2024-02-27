import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

function zodToOpenAISchema<T extends z.ZodType>(schema: T) {
  const { $schema, ...json } = zodToJsonSchema(schema);
  return json;
}

type ChatOptions = {
  /** An array of messages in the conversation so-far. */
  messages: Array<ChatCompletionMessageParam>;
};

type ChatOptionsWithTool<TSchema extends z.ZodType> = ChatOptions & {
  tool: {
    /** The name of the tool which the language model will be forced to call. */
    name: Exclude<string, "auto" | "none">;

    /** A description of the tool to the language model. */
    description?: string;

    /** A Zod schema to validate the arguments with which the language model calls the tool. */
    schema: TSchema;
  };
};

type ResponseMessage = {
  role: string;
  content: string | null;
};

type ResponseMessageWithCalls<TSchema extends z.ZodType> = ResponseMessage & {
  calls: Array<{ id: string; arguments: z.output<TSchema> }>;
};

export class ZGPT {
  private openAI: OpenAI;

  /**
   * Creates a new ZGPT instance given an OpenAI API key.
   */
  constructor(options: { key: string });

  /**
   * Creates a new ZGPT instance given an OpenAI instance.
   */
  constructor(options: { openAI: OpenAI });

  constructor(options: { key: string } | { openAI: OpenAI }) {
    this.openAI =
      "openAI" in options
        ? options.openAI
        : new OpenAI({ apiKey: options.key });
  }

  /**
   * Chat with the language model, expecting a text response.
   */
  async chat(options: ChatOptions): Promise<ResponseMessage>;

  /** Chat with the language model,
   * forcing it to respond with JSON data validated by a zod schema.  */
  async chat<TSchema extends z.ZodType>(
    options: ChatOptionsWithTool<TSchema>
  ): Promise<ResponseMessageWithCalls<TSchema>>;

  async chat(
    options: ChatOptions | ChatOptionsWithTool<z.ZodType>
  ): Promise<ResponseMessage | ResponseMessageWithCalls<z.ZodType>> {
    const completion = await this.openAI.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: options.messages,
      tools:
        "tool" in options
          ? [
              {
                type: "function",
                function: {
                  name: options.tool.name,
                  description: options.tool.description,
                  parameters: zodToOpenAISchema(options.tool.schema),
                },
              },
            ]
          : undefined,
    });

    const message = completion.choices[0].message;

    if (!("tool" in options))
      return { role: message.role, content: message.content };

    if (!message.tool_calls || message.tool_calls.length === 0)
      throw new Error("Expected tool calls but none were found");

    return {
      role: message.role,
      content: message.content,
      calls: message.tool_calls?.map((call) => {
        if (call.function.name !== options.tool.name)
          throw new Error("Unexpected tool call");

        return {
          id: call.id,
          arguments: z
            .string()
            .transform((s) => JSON.parse(s))
            .pipe(options.tool.schema)
            .parse(call.function.arguments),
        };
      }),
    };
  }
}
