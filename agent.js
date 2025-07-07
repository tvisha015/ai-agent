import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const message = [
    {
      role: "system",
      content: `Your name is Mr. DebugMaster, your task is to help coders with their bugs while they code date ${new Date().toUTCString()}`
    },
  ]
  message.push({
    role : "user",
    content : "What is dsa?"
  })
  const completion = await groq.chat.completions
    .create({
      messages: [
        {
            role: "assistant",
            content: `Your name is Mr. DebugMaster, your task is to help coders with their bugs while they code date ${new Date().toUTCString()}`
        },
        {
          role: "user",
          content: "Hi who are you?",
        },
      ],
      model: "llama-3.3-70b-versatile",
      tools: [
        {
            type: 'function',
            function: {
                name: 'debugCode',
                description: 'Solve the code problems as given by user',
                parameters: {
                    type: 'object',
                    properties: {
                        from: {
                            type: 'string',
                            description: 'solve errors'
                        },
                        to: {
                            type: 'string',
                            description: 'solve errors'
                        }
                    }
                }
            }
        }
      ]
    })
    console.log(JSON.stringify(completion.choices[0], null, 2));

    const toolCalls = completion.choices[0].message.tool_calls;
    if(!toolCalls){
        console.log(`Assistant: ${completion.choices[0].message.content}`)
    }
}

main();

function debugCode({from, to}) {
  console.log("debugCode");
} 