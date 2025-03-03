import { createAnthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { z } from "zod";

export async function POST(req) {
  try {
    const body = await req.json();
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const result = streamObject({
      model: anthropic("claude-3-5-sonnet-20241022"),
      schema: z.object({
        performanceAnalysis: z
          .object({
            type: z
              .enum(["info", "warning", "danger"])
              .describe("The type of the analysis"),
            message: z.string().describe("The message of the analysis"),
          })
          .array()
          .describe("The performance analysis of the operation"),
        suggestedIndexes: z
          .object({
            index: z
              .string()
              .describe(
                "The index query that could improve the operation's performance"
              ),
            message: z
              .string()
              .describe(
                "The message of the suggested index, why it improves the operation's performance and how it will affect the query"
              ),
          })
          .array()
          .describe("The suggested indexes for the operation"),
        suggestedQuery: z
          .string()
          .describe("The suggested query for the operation"),
      }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a MongoDB performance expert. Analyze this MongoDB operation: 
                ${JSON.stringify(body, null, 2)}`,
            },
          ],
        },
      ],
    });

    // Return the stream
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in analyze-operation:", error);

    return new Response(
      JSON.stringify({
        problem: "Failed to analyze operation",
        cause:
          "An internal error occurred while trying to analyze the operation. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
