import { appendFile } from 'fs/promises';
import { readFile } from 'fs/promises';
async function first() {
// First API call with reasoning
let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    "model": "openai/gpt-oss-120b:free",
    "messages": [
      {
        "role": "user",
      "content" : "You are akinator, a game where you guess the character the user is thinking of by asking yes/no questions. what is the first question you would ask the user to try to guess the character they are thinking of?"
    },
  ],
    "reasoning": {"enabled": true}
  })
});




// Extract the assistant message with reasoning_details and save it to the response variable
const result = await response.json();
response = result.choices[0].message;
const assistantMsg = result.choices[0].message;




// Preserve the assistant message with reasoning_details
// Construct message history
const messages = [
  {
    role: 'user',
    content: "You are akinator, a game where you guess the character the user is thinking of by asking yes/no questions. what is the first question you would ask the user to try to guess the character they are thinking of?"
  },
  {
    role: 'assistant',
    content: assistantMsg.content,
    reasoning: assistantMsg.reasoning, // Use 'reasoning' to preserve chain
  },
  {
    role: 'user',
    content: "Are you sure? Think carefully.",
  },
];




// Second API call - model continues reasoning from where it left off
const response2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    "model": "openai/gpt-oss-120b:free",
    "messages": messages  // Includes preserved reasoning_details
  })
});


// OUTPUT
const result2 = await response2.json();
console.log("--- First Model Response ---");
console.log(assistantMsg.content);




console.log("\n--- Second Model Response (After Rethinking) ---");
console.log(result2.choices[0].message.content);


// log messages
  await appendFile('messages.txt', `${assistantMsg.content}\n`);
  await appendFile('messages.txt', `${result2.choices[0].message.content}\n`);
}
async function sendUserAnswer(answer: string) {
  // append the user's answer to the conversation log
  await appendFile('messages.txt', `User: ${answer}\n`);


  const convo = await readFile('messages.txt', 'utf-8');


  // First model call: produce assistant reply given the current conversation
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
    "Authorization": `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [
        {
          role: 'user',
          content: "You are akinator, a game where you guess the character the user is thinking of by asking yes/no questions. the user and you have already gotten up to this point in the game:" + convo
        }
      ],
      reasoning: { enabled: true }
    })
  });


  const result = await response.json();
  const assistantMsg = result.choices[0].message;


  // Preserve assistant reasoning and ask it to double-check
  const messages = [
    {
      role: 'user',
      content: "You are akinator, a game where you guess the character the user is thinking of by asking yes/no questions. the user and you have already gotten up to this point in the game:" + convo
    },
    {
      role: 'assistant',
      content: assistantMsg.content,
      reasoning: assistantMsg.reasoning,
    },
    {
      role: 'user',
      content: "Are you sure? Think carefully.",
    },
  ];


  // Second model call: continue reasoning
  const response2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
    "Authorization": `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: messages
    })
  });


  const result2 = await response2.json();


  console.log("--- Assistant Response ---");
  console.log(assistantMsg.content);
  console.log("\n--- Assistant After Rethinking ---");
  console.log(result2.choices[0].message.content);


  // log messages to file for future turns
  await appendFile('messages.txt', `${assistantMsg.content}\n`);
  await appendFile('messages.txt', `${result2.choices[0].message.content}\n`);
}


async function yes() {
  await sendUserAnswer('Yes');
}


async function no() {
  await sendUserAnswer('No');
}


async function maybe() {
  await sendUserAnswer('Maybe');
}
first().catch(console.error);




