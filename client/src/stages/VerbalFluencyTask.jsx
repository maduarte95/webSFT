// import React, { useState, useEffect } from "react";
// import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
// import { Button } from "../components/Button";

// let hintRequestCount = 0;
// let lastHintRequestTime = 0;

// export function VerbalFluencyTask() {
//   const [words, setWords] = useState([]);
//   const [currentWord, setCurrentWord] = useState("");
//   const [lastWord, setLastWord] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const player = usePlayer();
//   const round = useRound();
//   const stage = useStage();
//   const category = player.round.get("category");

//   const canRequestHint = () => {
//     if (words.length === 0) return true;
//     const lastWord = words[words.length - 1];
//     return lastWord.source === 'user'; // Similar to HHCollab's 'main'
//   };
  
//   useEffect(() => {
//     player.round.set("roundName", "SelfInitiatedLLM");
//     console.log(`Component rendered. Start time: ${stage.get("serverStartTime")}, Current time: ${Date.now()}`);
//   }, []);

//   useEffect(() => {
//     const savedWords = player.round.get("words") || [];
//     setWords(savedWords);
//     const lastSavedWord = savedWords[savedWords.length - 1];
//     if (lastSavedWord) {
//       // setLastWord(lastSavedWord.source === 'ai' ? `AI Hint: ${lastSavedWord.text}` : lastSavedWord.text);
//       setLastWord(lastSavedWord.source === 'ai' ? `Partner: ${lastSavedWord.text}` : `You: ${lastSavedWord.text}`);
//     }
//   }, [player.round.get("words")]);

//   useEffect(() => {
//     const response = player.stage.get("apiResponse");
//     if (response) {
//       handleAIResponse(response);
//     }
//   }, [player.stage.get("apiResponse")]);

//   async function getServerTimestamp() {
//     console.log("Requesting server timestamp");
//     player.set("requestTimestamp", true);
    
//     await new Promise(resolve => setTimeout(resolve, 50));
    
//     return new Promise((resolve) => {
//       const checkTimestamp = () => {
//         const timestamp = player.get("serverTimestamp");
//         if (timestamp !== undefined) {
//           console.log("Received server timestamp:", timestamp);
//           resolve(timestamp);
//         } else {
//           setTimeout(checkTimestamp, 50);
//         }
//       };
//       checkTimestamp();
//     });
//   }

//   async function handleSendWord() {
//     if (currentWord.trim() === "") return;

//     const clientStartTime = Date.now();
//     console.log(`Word submission initiated at client time: ${clientStartTime}`);

//     const timestamp = await getServerTimestamp();
//     const serverStartTime = stage.get("serverStartTime");
//     const clientEndTime = Date.now();

//     console.log(`Word submission details:
//       Word: ${currentWord.trim()}
//       Request start time: ${clientStartTime}
//       Request end time: ${clientEndTime}
//       Request duration: ${clientEndTime - clientStartTime}ms
//       Server timestamp: ${timestamp}
//       Server start time: ${serverStartTime}
//       Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

//     if (serverStartTime && timestamp) {
//       const relativeTimestamp = timestamp - serverStartTime;
//       const updatedWords = [...words, { 
//         text: currentWord.trim(), 
//         source: 'user', 
//         timestamp: relativeTimestamp 
//       }];
//       setWords(updatedWords);
//       player.round.set("words", updatedWords);
//       player.round.set("lastWord", currentWord.trim());
//       setLastWord(currentWord.trim());
//       setCurrentWord("");
  
//       const userWordCount = updatedWords.filter(word => word.source === 'user').length;
//       player.round.set("score", userWordCount);

//       console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
//     } else {
//       console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
//     }
//   }

//   async function getHint() {

//     if (!canRequestHint()) {
//       return;
//     }
    
//     hintRequestCount++;
//     const clientStartTime = Date.now();
//     console.log(`Hint request #${hintRequestCount} initiated at client time: ${clientStartTime}`);

//     setIsLoading(true);
//     const timestamp = await getServerTimestamp();
//     const serverStartTime = stage.get("serverStartTime");
//     const clientEndTime = Date.now();

//     console.log(`Hint request #${hintRequestCount} details:
//       Request start time: ${clientStartTime}
//       Request end time: ${clientEndTime}
//       Request duration: ${clientEndTime - clientStartTime}ms
//       Server timestamp: ${timestamp}
//       Server start time: ${serverStartTime}
//       Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

//     if (serverStartTime && timestamp) {
//       const relativeTimestamp = timestamp - serverStartTime;
//       const requestTimestamps = player.round.get("requestTimestamps") || [];
//       const updatedTimestamps = [...requestTimestamps, relativeTimestamp];
//       player.round.set("requestTimestamps", updatedTimestamps);
//       console.log(`Updated timestamps for request #${hintRequestCount}: ${JSON.stringify(updatedTimestamps)}`);

//       lastHintRequestTime = timestamp; // Store the timestamp of the last hint request

//       try {
//         await player.set("apiTrigger", true);
//       } catch (error) {
//         console.error("Failed to trigger API call", error);
//         setIsLoading(false);
//       }
//     } else {
//       console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
//       setIsLoading(false);
//     }
//   }

//   async function handleAIResponse(response) {
//     const timestamp = await getServerTimestamp();
//     const serverStartTime = stage.get("serverStartTime");

//     if (serverStartTime && timestamp && lastHintRequestTime) {
//       const relativeTimestamp = timestamp - serverStartTime;
//       const apiLatency = timestamp - lastHintRequestTime;

//       console.log(`LLM API Response Latency: ${apiLatency}ms`);

//       const updatedWords = [...words, { 
//         text: response, 
//         source: 'ai', 
//         timestamp: relativeTimestamp,
//         apiLatency: apiLatency
//       }];
//       setWords(updatedWords);
//       player.round.set("words", updatedWords);
//       // setLastWord(`AI Hint: ${response}`);
//       setIsLoading(false);
//       player.stage.set("apiResponse", null);

//       console.log(`AI response added. Updated words: ${JSON.stringify(updatedWords)}`);
//     } else {
//       console.error("Invalid timestamp or start time for AI response", { timestamp, serverStartTime, lastHintRequestTime });
//     }
//   }

//   function handleKeyDown(event) {
//     if (event.key === "Enter") {
//       handleSendWord();
//     } 
//     // else if (event.key === "ArrowUp") {
//     //   getHint();
//     // }
//   }

//   return (
//   <div className="flex flex-col items-center justify-center h-full">
//   <div className="text-2xl font-bold mb-4">
//     Your Role: Main Player
//   </div>
  
//   <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
  
//   <div className="mt-8 text-4xl font-bold mb-8">
//     {lastWord || "No words yet"}
//   </div>
  
//   <div className="w-full max-w-md">
//     <div className="flex items-center mb-4">
//       <input
//         value={currentWord}
//         onChange={(e) => setCurrentWord(e.target.value)}
//         onKeyDown={handleKeyDown}
//         placeholder="Enter an item..."
//         className={`flex-grow p-2 border rounded mr-2 ${
//           isLoading 
//             ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
//             : 'border-gray-300'
//         }`}
//         disabled={isLoading}
//       />
//       <Button 
//         handleClick={handleSendWord}
//         disabled={isLoading || currentWord.trim() === ""}
//       >
//         Send
//       </Button>
//     </div>
    
//     <Button 
//       handleClick={getHint}
//       disabled={isLoading || !canRequestHint()}
//     >
//       Request Hint
//     </Button>

//     {/* Status Messages */}
//     {!canRequestHint() && !isLoading && (
//       <p className="mt-2 text-gray-600">Please enter a word before requesting another hint.</p>
//     )}
//     {isLoading && (
//       <p className="mt-2 text-gray-600">Waiting for partner's hint...</p>
//     )}
//   </div>
// </div>
//   );
// }


//Before 20-02-25 update
// import React, { useState, useEffect, useRef } from "react";
// import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
// import { Button } from "../components/Button";

// let hintRequestCount = 0;
// let lastHintRequestTime = 0;

// export function VerbalFluencyTask() {
//   const [words, setWords] = useState([]);
//   const [currentWord, setCurrentWord] = useState("");
//   const [lastWord, setLastWord] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const player = usePlayer();
//   const round = useRound();
//   const stage = useStage();
//   const category = player.round.get("category");
//   const inputRef = useRef(null);

//   // Add serverStartTime check
//   const serverStartTime = stage.get("serverStartTime");
//   if (!serverStartTime) {
//     return <div>Loading...</div>;
//   }

//   const canRequestHint = () => {
//     if (words.length === 0) return true;
//     const lastWord = words[words.length - 1];
//     return lastWord.source === 'user';
//   };
  
//   useEffect(() => {
//     if (!isLoading && inputRef.current) {
//       inputRef.current.focus();
//     }
//   }, [isLoading]);

//   useEffect(() => {
//     player.round.set("roundName", "SelfInitiatedLLM");
//     console.log(`Component rendered. Start time: ${stage.get("serverStartTime")}, Current time: ${Date.now()}`);
//   }, []);

//   useEffect(() => {
//     const savedWords = player.round.get("words") || [];
//     setWords(savedWords);
//     const lastSavedWord = savedWords[savedWords.length - 1];
//     if (lastSavedWord) {
//       setLastWord(lastSavedWord.source === 'ai' ? `Partner: ${lastSavedWord.text}` : `You: ${lastSavedWord.text}`);
//     }
//   }, [player.round.get("words")]);

//   useEffect(() => {
//     const response = player.stage.get("apiResponse");
//     if (response) {
//       handleAIResponse(response);
//     }
//   }, [player.stage.get("apiResponse")]);

//   async function getServerTimestamp() {
//     console.log("Requesting server timestamp for stage", stage.get("name"));
//     player.set("requestTimestamp", true);
    
//     await new Promise(resolve => setTimeout(resolve, 50));
    
//     return new Promise((resolve) => {
//       const checkTimestamp = () => {
//         const timestamp = player.stage.get("serverTimestamp");
//         if (timestamp !== undefined) {
//           console.log("Received server timestamp:", timestamp);
//           resolve(timestamp);
//         } else {
//           setTimeout(checkTimestamp, 50);
//         }
//       };
//       checkTimestamp();
//     });
//   }

//   async function handleSendWord() {
//     if (currentWord.trim() === "") return;

//     const clientStartTime = Date.now();
//     console.log(`Word submission initiated at client time: ${clientStartTime}`);

//     const timestamp = await getServerTimestamp();
//     const clientEndTime = Date.now();

//     console.log(`Word submission details:
//       Word: ${currentWord.trim()}
//       Request start time: ${clientStartTime}
//       Request end time: ${clientEndTime}
//       Request duration: ${clientEndTime - clientStartTime}ms
//       Server timestamp: ${timestamp}
//       Server start time: ${serverStartTime}
//       Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

//     const relativeTimestamp = timestamp - serverStartTime;
//     const updatedWords = [...words, { 
//       text: currentWord.trim(), 
//       source: 'user', 
//       timestamp: relativeTimestamp 
//     }];
//     setWords(updatedWords);
//     player.round.set("words", updatedWords);
//     player.round.set("lastWord", currentWord.trim());
//     setLastWord(`You: ${currentWord.trim()}`);
//     setCurrentWord("");

//     const userWordCount = updatedWords.filter(word => word.source === 'user').length;
//     player.round.set("score", userWordCount);

//     console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
//   }

//   async function getHint() {
//     if (!canRequestHint()) {
//       return;
//     }
    
//     hintRequestCount++;
//     const clientStartTime = Date.now();
//     console.log(`Hint request #${hintRequestCount} initiated at client time: ${clientStartTime}`);

//     setIsLoading(true);
//     const timestamp = await getServerTimestamp();
//     const clientEndTime = Date.now();

//     console.log(`Hint request #${hintRequestCount} details:
//       Request start time: ${clientStartTime}
//       Request end time: ${clientEndTime}
//       Request duration: ${clientEndTime - clientStartTime}ms
//       Server timestamp: ${timestamp}
//       Server start time: ${serverStartTime}
//       Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

//     const relativeTimestamp = timestamp - serverStartTime;
//     const requestTimestamps = player.round.get("requestTimestamps") || [];
//     const updatedTimestamps = [...requestTimestamps, relativeTimestamp];
//     player.round.set("requestTimestamps", updatedTimestamps);
//     console.log(`Updated timestamps for request #${hintRequestCount}: ${JSON.stringify(updatedTimestamps)}`);

//     lastHintRequestTime = timestamp;

//     try {
//       await player.set("apiTrigger", true);
//     } catch (error) {
//       console.error("Failed to trigger API call", error);
//       setIsLoading(false);
//     }
//   }

//   async function handleAIResponse(response) {
//     const timestamp = await getServerTimestamp();

//     if (serverStartTime && timestamp && lastHintRequestTime) {
//       const relativeTimestamp = timestamp - serverStartTime;

//       const updatedWords = [...words, { 
//         text: response.text,  // Changed to use response.text
//         source: 'ai', 
//         timestamp: relativeTimestamp,
//         apiLatency: response.apiLatency  // Use provided latency
//       }];
//       setWords(updatedWords);
//       player.round.set("words", updatedWords);
//       setLastWord(`Partner: ${response.text}`);
//       setIsLoading(false);
//       player.stage.set("apiResponse", null);

//       console.log(`AI response added. Updated words: ${JSON.stringify(updatedWords)}`);
//     } else {
//       console.error("Invalid timestamp or start time for AI response", { timestamp, serverStartTime, lastHintRequestTime });
//     }
//   }

//   function handleKeyDown(event) {
//     if (event.key === "Enter") {
//       handleSendWord();
//     }
//   }

//   return (
//     <div className="flex flex-col items-center justify-center h-full">
//       <div className="text-2xl font-bold mb-4">
//         Your Role: Main Player
//       </div>
      
//       <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
      
//       <div className="mt-8 text-4xl font-bold mb-8">
//         {lastWord || "No words yet"}
//       </div>
      
//       <div className="w-full max-w-md">
//         <div className="flex items-center mb-4">
//           <input
//             ref = {inputRef}
//             value={currentWord}
//             onChange={(e) => setCurrentWord(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder="Enter an item..."
//             className={`flex-grow p-2 border rounded mr-2 ${
//               isLoading 
//                 ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
//                 : 'border-gray-300'
//             }`}
//             disabled={isLoading}
//             autoFocus
//           />
//           <Button 
//             handleClick={handleSendWord}
//             disabled={isLoading || currentWord.trim() === ""}
//           >
//             Send
//           </Button>
//         </div>
        
//         <Button 
//           handleClick={getHint}
//           disabled={isLoading || !canRequestHint()}
//         >
//           Request Hint
//         </Button>

//         {/* Status Messages */}
//         {!canRequestHint() && !isLoading && (
//           <p className="mt-2 text-gray-600">Please enter a word before requesting another hint.</p>
//         )}
//         {isLoading && (
//           <p className="mt-2 text-gray-600">Waiting for partner's hint...</p>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function VerbalFluencyTask() {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();
  const category = player.round.get("category");
  const inputRef = useRef(null);
  
  // Add refs for synchronous state checks
  const isSubmittingRef = useRef(false);
  const pendingResponseRef = useRef(false);

  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  // Focus input when loading state changes
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    player.round.set("roundName", "SelfInitiatedLLM");
  }, []);

  useEffect(() => {
    const savedWords = player.round.get("words") || [];
    setWords(savedWords);
    const lastSavedWord = savedWords[savedWords.length - 1];
    if (lastSavedWord) {
      setLastWord(lastSavedWord.source === 'ai' ? `Partner: ${lastSavedWord.text}` : `You: ${lastSavedWord.text}`);
    }
  }, [player.round.get("words")]);

  useEffect(() => {
    const response = player.stage.get("apiResponse");
    if (response && (isLoading || pendingResponseRef.current)) {
      handleAIResponse(response);
    }
  }, [player.stage.get("apiResponse")]);

  async function getServerTimestamp() {
    console.log(`[Player ${player.id}] Requesting server timestamp for stage ${stage.get("name")}`);
    
    // Clear existing timestamp
    await player.stage.set("serverTimestamp", undefined);
    console.log(`[Player ${player.id}] Cleared existing timestamp`);
    
    // Set request flag
    await player.set("requestTimestamp", true);
    console.log(`[Player ${player.id}] Set request flag`);

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const checkTimestamp = () => {
        attempts++;
        const timestamp = player.stage.get("serverTimestamp");
        console.log(`[Player ${player.id}] Check attempt ${attempts}: timestamp=${timestamp}`);
        
        if (timestamp) {
          resolve(timestamp);
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Failed to get timestamp after ${maxAttempts} attempts`));
        } else {
          setTimeout(checkTimestamp, 100);
        }
      };
      
      checkTimestamp();
    });
  }

  async function handleSendWord() {
    // Synchronous checks with ref
    if (currentWord.trim() === "" || isSubmittingRef.current) {
      return;
    }
    
    // Immediately lock submissions and capture word
    isSubmittingRef.current = true;
    const wordToSubmit = currentWord.trim();
    setCurrentWord(""); // Clear input immediately

    try {
      // Check for duplicates before proceeding
      const existingWords = player.round.get("words") || [];
      const isDuplicate = existingWords.some(w => 
        w.text.toLowerCase() === wordToSubmit.toLowerCase() &&
        w.source === 'user'
      );

      if (isDuplicate) {
        console.log(`[Player ${player.id}] Duplicate word rejected: ${wordToSubmit}`);
        setLastWord(`"${wordToSubmit}" was already used!`);
        return;
      }

      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("No timestamp received");
      }

      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error(`Invalid relative timestamp: ${relativeTimestamp}`);
      }

      const updatedWords = [...existingWords, {
        text: wordToSubmit,
        source: 'user',
        timestamp: relativeTimestamp
      }];

      await Promise.all([
        player.round.set("words", updatedWords),
        player.round.set("lastWord", wordToSubmit)
      ]);

      setWords(updatedWords);
      setLastWord(`You: ${wordToSubmit}`);

      const userWordCount = updatedWords.filter(word => word.source === 'user').length;
      player.round.set("score", userWordCount);

    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
      // Restore word on error if it wasn't a duplicate
      if (wordToSubmit && !words.some(w => w.text.toLowerCase() === wordToSubmit.toLowerCase())) {
        setCurrentWord(wordToSubmit);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function getHint() {
    // Enhanced validation
    if (isLoading || pendingResponseRef.current || isSubmittingRef.current) {
      console.log("Hint request rejected - operation in progress");
      return;
    }

    const words = player.round.get("words") || [];
    if (words.length > 0 && words[words.length - 1].source === 'ai') {
      console.log("Hint request rejected - last word was from AI");
      return;
    }

    try {
      setIsLoading(true);
      pendingResponseRef.current = true;

      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("Failed to get timestamp for hint request");
      }

      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error("Invalid relative timestamp");
      }

      // Record request timestamp
      const requestTimestamps = player.round.get("requestTimestamps") || [];
      const updatedTimestamps = [...requestTimestamps, relativeTimestamp];

      // Atomic updates
      await Promise.all([
        player.round.set("requestTimestamps", updatedTimestamps),
        player.round.set("lastHintRequestTime", timestamp),
        player.set("apiTrigger", true)
      ]);

    } catch (error) {
      console.error(`[Player ${player.id}] Failed to request hint:`, error);
      setIsLoading(false);
      pendingResponseRef.current = false;
    }
  }

  async function handleAIResponse(response) {
    pendingResponseRef.current = false;

    try {
      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("No timestamp received for AI response");
      }

      const relativeTimestamp = timestamp - serverStartTime;
      const updatedWords = [...words, {
        text: response.text,
        source: 'ai',
        timestamp: relativeTimestamp,
        apiLatency: response.apiLatency
      }];

      await player.round.set("words", updatedWords);
      setWords(updatedWords);
      setLastWord(`Partner: ${response.text}`);
      await player.stage.set("apiResponse", null);

    } catch (error) {
      console.error(`[Player ${player.id}] Failed to process AI response:`, error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-2xl font-bold mb-4">
        Your Role: Main Player
      </div>
      
      <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
      
      <div className="mt-8 text-4xl font-bold mb-8">
        {lastWord || "No words yet"}
      </div>
      
      <div className="w-full max-w-md">
        <div className="flex items-center mb-4">
          <input
            ref={inputRef}
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.repeat) {
                e.preventDefault();
                handleSendWord();
              }
            }}
            placeholder="Enter an item..."
            className={`flex-grow p-2 border rounded mr-2 ${
              isLoading || isSubmittingRef.current
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
            }`}
            disabled={isLoading || isSubmittingRef.current}
            autoFocus
          />
          <Button 
            handleClick={handleSendWord}
            disabled={
              isLoading || 
              isSubmittingRef.current || 
              currentWord.trim() === ""
            }
          >
            Send
          </Button>
        </div>
        
        <Button 
          handleClick={getHint}
          disabled={
            isLoading || 
            pendingResponseRef.current || 
            isSubmittingRef.current ||
            (words.length > 0 && words[words.length - 1].source === 'ai')
          }
        >
          Request Hint
        </Button>

        {/* Status Messages */}
        {(isLoading || pendingResponseRef.current) && (
          <p className="mt-2 text-gray-600">Waiting for partner's hint...</p>
        )}
        {!isLoading && words.length > 0 && words[words.length - 1].source === 'ai' && (
          <p className="mt-2 text-gray-600">Please enter a word before requesting another hint.</p>
        )}
      </div>
    </div>
  );
}