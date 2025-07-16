import readline from 'node:readline/promises';
import Groq from "groq-sdk";

const expenseDB = []
const incomeDB  = []
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAgent() {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `You are Renil, a smart and friendly personal finance assistant. Your role is to help users manage and understand their expenses by answering questions, calculating totals, analyzing spending patterns, and providing suggestions when needed. Today's date is ${new Date().toUTCString()}. Be concise, accurate, and helpful in your responses.
      You have access to two functions:
      1. getTotalExpense: This function calculates the total expense within a specified date range
      2. addExpense: This function allows users to add a new expense entry to the expense database.
      3. addIncome: This function allows users to add a new income entry to the income database.
      4. getTotalIncome: This function calculates the total income within a specified date range
      5. getMoneyBalance: This function calculates the remaining money balance by subtracting total expenses from total income.
      When the user asks for t  he total expense, you will call the getTotalExpense function with the appropriate date range.
      When the user wants to add a new expense, you will call the addExpense function with the name and amount of the expense.`,
    },
  ];

  // for user prompt loop
  while(true){
    // for agent
    const question = await rl.question("USER: ");

    if(question === "bye"){
      break;
    }

    messages.push({
      role: "user",
      content: question,
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
        {
          type: "function",
          function: {
            name: "addIncome",
            description:
              "Add new entry to income database",
            parameters: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the income. eg: salary, freelance work",
                },
                amount: {
                  type: "string",
                  description: "Amount of the income",
                },
              },
              required: ["name", "amount"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "getMoneyBalance",
            description:
              "get remaining money balance from database",
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
      }else if(functionName === "addIncome"){
        result = addIncome(JSON.parse(functionArgs));
      }else if(functionName === "getTotalIncome"){
        result = getTotalIncome(JSON.parse(functionArgs));
      }

      messages.push({
        role: "tool",
        content: result,
        tool_call_id: tool.id,
      })

    }
    // console.log("-----------");
    // console.log("Messages",messages)
    // console.log("-----------");
    // console.log("Expense DB", expenseDB);
    // console.log("-----------");
  }
  }
  rl.close();

}
callAgent();

function getTotalExpense({ from, to }) {
  // console.log("calling get total expenses");
  const expense = expenseDB.reduce((acc, item)=>{
    return acc + item.amount;
  }, 0)
  return `${expense} INR`;
}

function addExpense({ name, amount }) {
  // console.log("adding expense", name, amount);
  expenseDB.push({name, amount});
  return "added expense successfully";
}

function addIncome({ name, amount }) {
  incomeDB.push({name, amount});
  return "added income successfully";
}

function getMoneyBalance() {
  const totalIncome = incomeDB.reduce((acc, item) => {
    acc + item.amount;
  }, 0);
  const totalExpense = expenseDB.reduce((acc, item) => {
    acc + item.amount;
  }, 0);
  return `${totalIncome - totalExpense} INR`;
}