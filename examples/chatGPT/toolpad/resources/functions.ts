import {
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionRequestMessage,
} from 'openai';
import { createFunction } from '@mui/toolpad/server';
// import { createInterface } from 'node:readline/promises';
// import { stdin as input, stdout as output } from 'node:process';

// export const query_open3 = createFunction(
//   async function open3({ parameters }) {
//     const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
//     const openai = new OpenAIApi(configuration);

//     let userInput = '';
//     const messages = [{ role: 'system', content: 'Hello, What do you want to know?' }];

//     while (userInput !== '0') {
//       userInput = `${parameters.prompt}`;
//       messages.push({ role: 'user', content: userInput });
//       console.log(userInput);
//       try {
//         const response = await openai.createChatCompletion({
//           model: 'gpt-3.5-turbo',
//           messages,
//         });

//         const botMessage = response.data.choices[0].message;
//         if (botMessage) {
//           messages.push(botMessage);
//           userInput = `${parameters.prompt}`;
//           // botMessage.content;
//           console.log(messages);
//           // return botMessage.content;
//         } else {
//           userInput = '\nNo response, try asking again\n';
//         }
//       } catch (error) {
//         console.log(error.message);
//       }
//     }
//   },
//   {
//     parameters: {
//       prompt: {
//         typeDef: { type: 'string' },
//       },
//     },
//   },
// );

export const askGPT = createFunction(
  async function open4({ parameters }) {
    const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
    const openai = new OpenAIApi(configuration);

    try {
      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: parameters.messages as ChatCompletionRequestMessage[],
      });

      const gptResponse = response.data?.choices[0].message ?? {
        role: ChatCompletionRequestMessageRoleEnum.Assistant,
        content: 'No response',
      };

      return gptResponse;
    } catch (error) {
      return error;
    }
  },
  {
    parameters: {
      messages: {
        typeDef: { type: 'array' },
      },
    },
  },
);
