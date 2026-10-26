
import { ChatOpenRouter } from "@langchain/openrouter";
import { tavily } from "@tavily/core";
import { config } from "dotenv";
import { HumanMessage, AIMessage, SystemMessage, tool, createAgent, AIMessageChunk } from "langchain";
import rl from "readline/promises"
import * as z from "zod"

config();


async function getLatestInformation({ query }) {
    const response = await tavilyClient.search(query);
    return response.results.map(result => result.content).join("\n\n");
}

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

const getLatestInformationTool = tool(getLatestInformation, {
    name: "get_latest_information",
    description:"get latest information about every topic",
    schema: z.object({
        query: z.string().describe("The topic to get latest information about ")
    })
});

const readline = rl.createInterface({
    input : process.stdin,
    output : process.stdout
})

const model = new ChatOpenRouter({
    model: "openrouter/free",
    apiKey: process.env.OPEN_ROUTER_KEY,
});
const agent = createAgent({
    model,
    tools:[getLatestInformationTool]
})

const messages = [
    new SystemMessage(`You are alex and you are a professional MERN STACK teacher and a joyful developer who loves to help people.
    current date is ${new Date().toLocaleDateString()}
        `)
];

while(true) {
    const UserPrompt = await readline.question("Enter your Prompt:");
    messages.push(new HumanMessage(UserPrompt));

    let Aimessage = ""

    const response = await agent.stream(
        { messages },
        { streamMode: "messages" }
    );

    for await(const [chunks] of response)
    {
        if(chunks instanceof AIMessageChunk)
        process.stdout.write(chunks.text)
        Aimessage += chunks.text
    }

    messages.push(new AIMessage(Aimessage))

    process.stdout.write("\n")
}
