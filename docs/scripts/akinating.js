const yes = document.getElementById("yes-button");
const no = document.getElementById("no-button");
const dontknow = document.getElementById("dont-know-button");
const output = document.getElementById("akinator-output");

const STORAGE_KEY = "aiakinator_conversation";

yes.addEventListener("click", () => handleResponse("yes"));
no.addEventListener("click", () => handleResponse("no"));
dontknow.addEventListener("click", () => handleResponse("don't know"));

window.addEventListener("DOMContentLoaded", () => {
  if (!getConversation()) {
    first().catch((error) => appendOutput(`Error: ${error.message}`));
  }
});

function getConversation() {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function saveConversation(line) {
  const previous = getConversation();
  localStorage.setItem(STORAGE_KEY, `${previous}${line}\n`);
}

function clearConversation() {
  localStorage.removeItem(STORAGE_KEY);
}

function appendOutput(text, role = "") {
  if (output) {
    const p = document.createElement("p");
    p.textContent = text;
    p.className = role ? `chat-message ${role}` : "chat-message";
    output.appendChild(p);
    output.scrollTop = output.scrollHeight;
  }
  console.log(text);
}

function getApiKey() {
  const saved = localStorage.getItem("OPENROUTER_API_KEY");
  if (saved) {
    return saved;
  }

  const promptKey = prompt("Enter your OpenRouter API key:");
  if (!promptKey) {
    throw new Error("OpenRouter API key is required.");
  }

  localStorage.setItem("OPENROUTER_API_KEY", promptKey.trim());
  return promptKey.trim();
}

async function first() {
  const apiKey = getApiKey();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [
        {
          role: "user",
          content:
            "You are akinator, a game where you guess the character the user is thinking of by asking yes/no questions. What is the first question you would ask the user?",
        },
      ],
    }),
  });

  const result = await response.json();
  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    throw new Error("Unexpected API response format.");
  }

  const assistantMsg = result.choices[0].message;
  saveConversation(`Assistant: ${assistantMsg.content}`);
  appendOutput(`Akinator: ${assistantMsg.content}`, "assistant");
}

async function guessCharacter() {
  const apiKey = getApiKey();
  const convo = getConversation();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b:free",
      messages: [
        {
          role: "user",
          content:
            "You are akinator, a game where you guess the character the user is thinking of by asking yes/no questions. The user and you have already gotten up to this point in the game:\n" +
            convo,
        },
      ],
    }),
  });

  const result = await response.json();
  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    throw new Error("Unexpected API response format.");
  }

  const assistantMsg = result.choices[0].message;
  saveConversation(`Assistant: ${assistantMsg.content}`);
  appendOutput(`Akinator: ${assistantMsg.content}`, "assistant");
}

async function handleResponse(answer) {
  saveConversation(`User: ${answer}`);
  appendOutput(`You: ${answer}`, "user");
  await guessCharacter();
}

function clearMessages() {
  clearConversation();
  if (output) output.innerHTML = "";
  appendOutput("Cleared message history.");
}
