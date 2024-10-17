// import Together from "together-ai";
// import dotenv from "dotenv";
// import fs from 'fs';
// import path from 'path';


// dotenv.config();

// export class LLM {
//     constructor(systemPrompt = "", model = "") {
//       const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
//       this.client = new Together({ apiKey: TOGETHER_API_KEY });
  
//       this.model = model || "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
//       this.systemPrompt = systemPrompt;
//       console.log("System prompt:", this.systemPrompt);
//       this.systemMessage = { role: "system", content: this.systemPrompt };
//       this.history = [];
//     }
  
//     async generate(userPrompt = null) {
//       console.log("Generating response...");
//       if (!userPrompt) {
//         throw new Error("User prompt is required");
//       }
  
//       const promptMessage = { role: "user", content: userPrompt };
//       this.history.push(promptMessage);
//       const fullChat = [this.systemMessage, ...this.history];
  
//       const response = await this.client.chat.completions.create({
//         model: this.model,
//         messages: fullChat,
//         max_tokens: 512,
//         // temperature: 0.7,
//         // top_p: 0.7,
//         // top_k: 50,
//         // repetition_penalty: 1,
//         // stream_tokens: false,
//         // stop: ["<|eot_id|>"],
//         // negative_prompt: ""
//       });
  
//       const output = response.choices[0].message.content;
//       const answerMessage = { role: "assistant", content: output };
//       this.history.push(answerMessage);
//       console.log("Full chat:", fullChat);
//       console.log("Assistant:", output);
//       return output;
//     }

    // readPromptFile(filePath) {
    //     return new Promise((resolve, reject) => {
    //       fs.readFile(path.resolve(filePath), 'utf8', (err, data) => {
    //         if (err) {
    //           reject(err);
    //         } else {
    //           resolve(data);
    //         }
    //       });
    //     });
    //   }
    // }


import Together from "together-ai";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

dotenv.config();

export class LLM {
    constructor(systemPrompt = "") {
      const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
      this.client = new Together({ apiKey: TOGETHER_API_KEY });
  
      // Load configuration
      const configPath = path.join(__dirname, '..', 'llm_config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
      this.model = config.defaultModel;
      this.systemPrompt = systemPrompt;
      this.systemMessage = { role: "system", content: this.systemPrompt };
      this.history = [];
      this.apiParameters = config.apiParameters;
    }
  
    async generate(userPrompt = null) {
      if (!userPrompt) {
        throw new Error("User prompt is required");
      }
  
      const promptMessage = { role: "user", content: userPrompt };
      this.history.push(promptMessage);
      const fullChat = [this.systemMessage, ...this.history];
  
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: fullChat,
        ...this.apiParameters
      });
  
      const output = response.choices[0].message.content;
      const answerMessage = { role: "assistant", content: output };
      this.history.push(answerMessage);
      return output;
    }

    readPromptFile(filePath) {
      return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(filePath), 'utf8', (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }    
}