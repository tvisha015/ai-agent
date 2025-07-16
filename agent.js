import Groq from "groq-sdk";
const expenseDB = []
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {
  const messages = [
    {
      role: "system",
      content: `You are Renil, a smart and friendly personal finance assistant. Your role is to help users manage and understand their expenses by answering questions, calculating totals, analyzing spending patterns, and providing suggestions when needed. Today's date is ${new Date().toUTCString()}. Be concise, accurate, and helpful in your responses.`,
    },
  ];

  messages.push({
    role: "user",
    content: "Hey I just bought an iPhone for 1,00,000 INR. Can you add this expense to my records?",
  });

  while(true){
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      tools: [
        {
          type: "function",
          function: {
            name: "getTotalExpense",
            description: "Calculates the total expense",
            parameters: {
              type: "object",
              properties: {
                from: {
                  type: "string",
                  description: "Start date of the expense range",
                },
                to: {
                  type: "string",
                  description: "End date of the expense range",
                },
              },
              required: ["from", "to"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "addExpense",
            description:
              "Add new expense entry to the expense database",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the expense: bought an iPhone",
                },
                amount: {
                  type: "string",
                  description: "Amount of the expense",
                },
              },
              required: ["name", "amount"],
            },
          },
        },
      ],

    });

    messages.push(completion.choices[0].message)

    const toolCalls = completion.choices[0].message.tool_calls; 
    if (!toolCalls) {
      console.log(`assistant: ${completion.choices[0].message.content}`);
      break;
    }

    for (const tool of toolCalls) {
      const functionName = tool.function.name;
      const functionArgs = tool.function.arguments;

      let result = "";
      if (functionName === "getTotalExpense") {
        result = getTotalExpense(JSON.parse(functionArgs));
      }
      else if(functionName === "addExpense"){
        result = addExpense(JSON.parse(functionArgs));
      }

      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      })

    }
    console.log("-----------");
    console.log("Messages",messages)
    console.log("-----------");
    console.log("Expense DB", expenseDB);
    console.log("-----------");
  }

}
callAgent();

function getTotalExpense({ from, to }) {
  console.log("calling get total expenses");
  const expense = expenseDB.reduce((acc, item)=>{
    return acc + item.amount;
  }, 0)
  return `${expense} INR`;
}

function addExpense({ name, amount }) {
  console.log("adding expense", name, amount);
  expenseDB.push({name, amount});
  return "added expense successfully";
}