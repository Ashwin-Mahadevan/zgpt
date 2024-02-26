import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { z } from "zod";

type ChatOptions = {
  messages: Array<ChatCompletionMessageParam>;
};

type ChatOptionsWithTool<TSchema extends z.ZodType> = ChatOptions & {
  tool: {
    name: Exclude<string, "auto" | "none">;
    description: string;
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

  constructor(options: { key: string });
  constructor(options: { openAI: OpenAI });

  constructor(options: { key: string } | { openAI: OpenAI }) {
    this.openAI =
      "openAI" in options
        ? options.openAI
        : new OpenAI({ apiKey: options.key });
  }

  async chat(options: ChatOptions): Promise<ResponseMessage>;

  async chat<TSchema extends z.ZodType>(
    options: ChatOptionsWithTool<TSchema>
  ): Promise<ResponseMessageWithCalls<TSchema>>;

  async chat(
    options: ChatOptions | ChatOptionsWithTool<z.ZodType>
  ): Promise<ResponseMessage | ResponseMessageWithCalls<z.ZodType>> {
    const completion = await this.openAI.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: options.messages,
      tools:
        "tool" in options
          ? [
              {
                type: "function",
                function: {
                  name: options.tool.name,
                  description: options.tool.description,
                  parameters: { TODO: "TODO" },
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
          arguments: options.tool.schema.parse(call.function.arguments),
        };
      }),
    };
  }
}
