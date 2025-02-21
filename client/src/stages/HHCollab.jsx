// import React, { useState, useEffect, useRef  } from "react";
// import { usePlayer, usePlayers, useRound, useStage } from "@empirica/core/player/classic/react";
// import { Button } from "../components/Button";

// let hintRequestCount = 0;

// export function HHCollab() {
//   const [currentWord, setCurrentWord] = useState("");
//   const [lastWord, setLastWord] = useState("");
//   const player = usePlayer();
//   const players = usePlayers();
//   const partner = players.find(p => p.id !== player.id);
//   const isMain = player.get("role") === "main";
//   const round = useRound();
//   const stage = useStage();
//   const category = player.round.get("category");
//   const words = round.get("words") || [];
//   const wordListRef = useRef(null);  // to enable autoscroll to bottom of word list
//   const inputRef = useRef(null);

//   // Add serverStartTime check
//   const serverStartTime = stage.get("serverStartTime");
//   if (!serverStartTime) {
//     return <div>Loading...</div>;
//   }

//   player.round.set("roundName", "selfInitiatedHH");

//   // Helper function to check if hint request is allowed
//   const canRequestHint = () => {
//     if (words.length === 0) return true;
//     const lastWord = words[words.length - 1];
//     return lastWord.source === 'main'; //checks if last word was submitted by main player
//   };

//   useEffect(() => {
//     if (inputRef.current && ((isMain && !round.get("waitingForAssistant")) || (!isMain && round.get("waitingForAssistant")))) {
//       inputRef.current.focus();
//     }
//   }, [isMain, round.get("waitingForAssistant")]);

//   useEffect(() => {
//     if (wordListRef.current && !isMain) {
//       wordListRef.current.scrollTop = wordListRef.current.scrollHeight;
//     }
//   }, [words]);

//   useEffect(() => {
//     // const words = round.get("words") || [];
//     const lastSavedWord = words[words.length - 1];
//     if (lastSavedWord) {
//       const isOwnWord = (isMain && lastSavedWord.source === 'main') || (!isMain && lastSavedWord.source === 'helper');
//       setLastWord(isOwnWord ? `You: ${lastSavedWord.text}` : `Partner: ${lastSavedWord.text}`);
//     }
//     player.round.set("score", words.filter(word => word.source === 'main').length);
//   }, [round.get("words")]);

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
//     if (currentWord.trim() === "" || (isMain && round.get("waitingForAssistant"))) return;

//     const clientStartTime = Date.now();
//     console.log(`Word submission initiated at client time: ${clientStartTime}`);

//     const timestamp = await getServerTimestamp();
//     // const serverStartTime = stage.get("startTime") || stage.get("serverStartTime");
//     const clientEndTime = Date.now();

//     console.log(`Word submission details:
//         Word: ${currentWord.trim()}
//         Request start time: ${clientStartTime}
//         Request end time: ${clientEndTime}
//         Request duration: ${clientEndTime - clientStartTime}ms
//         Server timestamp: ${timestamp}
//         Server start time: ${serverStartTime}
//         Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

//     if (serverStartTime && timestamp) {
//         const relativeTimestamp = timestamp - serverStartTime;
//         const words = round.get("words") || [];
        
//         let wordEntry = { 
//             text: currentWord.trim(), 
//             source: isMain ? 'main' : 'helper', 
//             timestamp: relativeTimestamp 
//         };

//         // Add helper latency measurement if this is a helper response
//         if (!isMain && round.get("waitingForAssistant")) {
//             const lastHintRequestTime = round.get("lastHintRequestTime");
//             if (lastHintRequestTime) {
//                 const helperLatency = timestamp - lastHintRequestTime;
//                 wordEntry.helperLatency = helperLatency;
//                 console.log(`Helper response latency: ${helperLatency}ms`);
//             }
//         }

//         const updatedWords = [...words, wordEntry];
//         round.set("words", updatedWords);
//         setCurrentWord("");

//         if (!isMain) {
//             round.set("waitingForAssistant", false);
//             round.set("lastHintRequestTime", null); // Reset the request time
//         }

//         console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
//     } else {
//         console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
//     }
// }

//   async function handleRequestHint() {

//     // Add validation check
//     if (!canRequestHint()) {
//       return;
//     }

//     hintRequestCount++;
//     const clientStartTime = Date.now();
//     console.log(`Hint request #${hintRequestCount} initiated at client time: ${clientStartTime}`);
    
//     round.set("waitingForAssistant", true);
//     const timestamp = await getServerTimestamp();
//     const serverStartTime = stage.get("startTime") || stage.get("serverStartTime");
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
//       const requestTimestamps = round.get("requestTimestamps") || [];
//       const updatedTimestamps = [...requestTimestamps, relativeTimestamp];
//       round.set("requestTimestamps", updatedTimestamps);
//       round.set("lastHintRequestTime", timestamp); // Save the last hint request time
//       console.log(`Updated timestamps for request #${hintRequestCount}: ${JSON.stringify(updatedTimestamps)}`);
//     } else {
//       console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
//     }
//   }

//   function handleKeyDown(event) {
//     if (event.key === "Enter") {
//       handleSendWord();
//     }
//   }

//   return (
//     // Ass scrollable window for helper only
//     <div className="flex flex-col items-center justify-center h-full">
//       <div className="text-2xl font-bold mb-4">
//         Your Role: {isMain ? "Main Player" : "Helper"}
//       </div>
      
//       <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
      
//       {!isMain && (
//         <div className="w-full max-w-md mb-8">
//           <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
//             <h3 className="text-lg font-semibold mb-2">Word History:</h3>
//             <div 
//               ref={wordListRef}
//               className="h-48 overflow-y-auto mb-3"
//             >
//               {words.map((word, index) => (
//                 <div 
//                   key={index}
//                   className={`mb-1 ${
//                     word.source === 'helper' 
//                       ? 'text-blue-600' 
//                       : 'text-gray-600'
//                   }`}
//                 >
//                   {word.source === 'helper' ? 'You: ' : 'Main Player: '}{word.text}
//                 </div>
//               ))}
//             </div>
//             {round.get("waitingForAssistant") && (
//               <div className="bg-red-50 border border-red-200 rounded-md p-3">
//                 <p className="text-red-600 font-semibold text-center">
//                   ⚠️ Your partner needs your help! Please provide a word.
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {isMain && (
//         <div className="mt-8 text-4xl font-bold mb-8">
//           {lastWord || "No words yet"}
//         </div>
//       )}

//       <div className="w-full max-w-md">
//         <div className="flex items-center mb-4">
//           {/* <input
//             value={currentWord}
//             onChange={(e) => setCurrentWord(e.target.value)}
//             onKeyDown={handleKeyDown}
//             placeholder={isMain ? "Enter an item..." : "Enter your hint..."}
//             className={`flex-grow p-2 border rounded mr-2 ${
//               !isMain && round.get("waitingForAssistant") 
//                 ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
//                 : 'border-gray-300'
//             }`}
//             disabled={(isMain && round.get("waitingForAssistant")) || (!isMain && !round.get("waitingForAssistant"))}
//           /> */}
//           <input
//           ref={inputRef}
//           value={currentWord}
//           onChange={(e) => setCurrentWord(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder={isMain ? "Enter an item..." : "Enter your hint..."}
//           className={`flex-grow p-2 border rounded mr-2 ${
//             (isMain && round.get("waitingForAssistant")) || (!isMain && round.get("waitingForAssistant"))
//               ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
//               : 'border-gray-300'
//           }`}
//           disabled={(isMain && round.get("waitingForAssistant")) || (!isMain && !round.get("waitingForAssistant"))}
//           />
//           <Button 
//             handleClick={handleSendWord} 
//             disabled={(isMain && round.get("waitingForAssistant")) || (!isMain && !round.get("waitingForAssistant")) || currentWord.trim() === ""}
//           >
//             Send
//           </Button>
//         </div>

//         {isMain && (
//           <Button 
//             handleClick={handleRequestHint} 
//             disabled={round.get("waitingForAssistant") || !canRequestHint()}
//           >
//             Request Hint
//           </Button>
//         )}

//         {/* Status Messages */}
//         {isMain && !canRequestHint() && !round.get("waitingForAssistant") && (
//           <p className="mt-2 text-gray-600">Please enter a word before requesting another hint.</p>
//         )}
//         {round.get("waitingForAssistant") && isMain && (
//           <p className="mt-2 text-gray-600">Waiting for partner's hint...</p>
//         )}
//         {/* {!isMain && round.get("waitingForAssistant") && (
//           <p className="mt-2 text-gray-600">The main player needs your help! Please provide a word.</p>
//         )} */}
//         {!isMain && !round.get("waitingForAssistant") && (
//           <p className="mt-2 text-gray-600">Waiting partner to request assistance...</p>
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { usePlayer, usePlayers, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function HHCollab() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const player = usePlayer();
  const players = usePlayers();
  const partner = players.find(p => p.id !== player.id);
  const isMain = player.get("role") === "main";
  const round = useRound();
  const stage = useStage();
  const category = player.round.get("category");
  const wordListRef = useRef(null);
  const inputRef = useRef(null);
  
  // Add refs for synchronous state checks
  const isSubmittingRef = useRef(false);
  const pendingHintRef = useRef(false);

  // Add serverStartTime check
  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  const canRequestHint = () => {
    const words = round.get("words") || [];
    if (words.length === 0) return true;
    const lastWord = words[words.length - 1];
    return lastWord.source === 'main';
  };

  // Enhanced focus management
  useEffect(() => {
    const shouldFocus = (isMain && !round.get("waitingForAssistant")) || 
                       (!isMain && round.get("waitingForAssistant"));
    if (inputRef.current && shouldFocus && !isSubmittingRef.current) {
      inputRef.current.focus();
    }
  }, [isMain, round.get("waitingForAssistant"), isSubmittingRef.current]);

  // Word list auto-scroll for helper
  useEffect(() => {
    if (wordListRef.current && !isMain) {
      wordListRef.current.scrollTop = wordListRef.current.scrollHeight;
    }
  }, [round.get("words")]);

  // Word updates and score management
  useEffect(() => {
    const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      const isOwnWord = (isMain && lastSavedWord.source === 'main') || 
                       (!isMain && lastSavedWord.source === 'helper');
      setLastWord(isOwnWord ? `You: ${lastSavedWord.text}` : `Partner: ${lastSavedWord.text}`);
    }
    // Score is based on main player's words only
    player.round.set("score", words.filter(word => word.source === 'main').length);
  }, [round.get("words")]);

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
    // Initial validation
    if (currentWord.trim() === "" || isSubmittingRef.current || 
        (isMain && round.get("waitingForAssistant")) || 
        (!isMain && !round.get("waitingForAssistant"))) {
      return;
    }

    // Immediately lock submissions and capture word
    isSubmittingRef.current = true;
    const wordToSubmit = currentWord.trim();
    setCurrentWord(""); // Clear input immediately

    try {
      // Check for duplicates
      const words = round.get("words") || [];
      const isDuplicate = words.some(w => 
        w.text.toLowerCase() === wordToSubmit.toLowerCase() &&
        w.source === (isMain ? 'main' : 'helper')
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

      // Create word entry
      let wordEntry = {
        text: wordToSubmit,
        source: isMain ? 'main' : 'helper',
        timestamp: relativeTimestamp
      };

      // Add helper response timing if applicable
      if (!isMain && round.get("waitingForAssistant")) {
        const lastHintRequestTime = round.get("lastHintRequestTime");
        if (lastHintRequestTime) {
          wordEntry.helperLatency = timestamp - lastHintRequestTime;
        }
      }

      // Prepare updates
      const updatedWords = [...words, wordEntry];
      const updates = [round.set("words", updatedWords)];

      // Additional updates for helper responses
      if (!isMain) {
        updates.push(
          round.set("waitingForAssistant", false),
          round.set("lastHintRequestTime", null)
        );
      }

      // Apply all updates atomically
      await Promise.all(updates);

      console.log(`[Player ${player.id}] Word submission complete:`, {
        word: wordToSubmit,
        timestamp,
        relativeTimestamp,
        isMain,
        helperLatency: wordEntry.helperLatency
      });

    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
      // Restore word on error if it wasn't a duplicate
      if (wordToSubmit && !words?.some(w => w.text.toLowerCase() === wordToSubmit.toLowerCase())) {
        setCurrentWord(wordToSubmit);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }

  async function handleRequestHint() {
    // Enhanced validation
    if (!canRequestHint() || pendingHintRef.current || 
        isSubmittingRef.current || round.get("waitingForAssistant")) {
      return;
    }

    try {
      pendingHintRef.current = true;

      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("Failed to get timestamp for hint request");
      }

      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error("Invalid relative timestamp");
      }

      // Record request timestamp
      const requestTimestamps = round.get("requestTimestamps") || [];
      const updatedTimestamps = [...requestTimestamps, relativeTimestamp];

      // Atomic updates
      await Promise.all([
        round.set("requestTimestamps", updatedTimestamps),
        round.set("lastHintRequestTime", timestamp),
        round.set("waitingForAssistant", true)
      ]);

    } catch (error) {
      console.error(`[Player ${player.id}] Failed to request hint:`, error);
    } finally {
      pendingHintRef.current = false;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-2xl font-bold mb-4">
        Your Role: {isMain ? "Main Player" : "Helper"}
      </div>
      
      <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
      
      {!isMain && (
        <div className="w-full max-w-md mb-8">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Word History:</h3>
            <div 
              ref={wordListRef}
              className="h-48 overflow-y-auto mb-3"
            >
              {(round.get("words") || []).map((word, index) => (
                <div 
                  key={index}
                  className={`mb-1 ${
                    word.source === 'helper' 
                      ? 'text-blue-600' 
                      : 'text-gray-600'
                  }`}
                >
                  {word.source === 'helper' ? 'You: ' : 'Main Player: '}{word.text}
                </div>
              ))}
            </div>
            {round.get("waitingForAssistant") && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 font-semibold text-center">
                  ⚠️ Your partner needs your help! Please provide a word.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {isMain && (
        <div className="mt-8 text-4xl font-bold mb-8">
          {lastWord || "No words yet"}
        </div>
      )}

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
            placeholder={isMain ? "Enter an item..." : "Enter your hint..."}
            className={`flex-grow p-2 border rounded mr-2 ${
              (isMain && round.get("waitingForAssistant")) || 
              (!isMain && round.get("waitingForAssistant"))
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300'
            }`}
            disabled={
              isSubmittingRef.current || 
              (isMain && round.get("waitingForAssistant")) || 
              (!isMain && !round.get("waitingForAssistant"))
            }
            autoFocus
          />
          <Button 
            handleClick={handleSendWord} 
            disabled={
              isSubmittingRef.current || 
              (isMain && round.get("waitingForAssistant")) || 
              (!isMain && !round.get("waitingForAssistant")) || 
              currentWord.trim() === ""
            }
          >
            Send
          </Button>
        </div>

        {isMain && (
          <Button 
            handleClick={handleRequestHint}
            disabled={
              pendingHintRef.current || 
              isSubmittingRef.current || 
              round.get("waitingForAssistant") || 
              !canRequestHint()
            }
          >
            Request Hint
          </Button>
        )}

        {/* Status Messages */}
        {isMain && !canRequestHint() && !round.get("waitingForAssistant") && (
          <p className="mt-2 text-gray-600">Please enter a word before requesting another hint.</p>
        )}
        {round.get("waitingForAssistant") && isMain && (
          <p className="mt-2 text-gray-600">Waiting for partner's hint...</p>
        )}
        {!isMain && !round.get("waitingForAssistant") && (
          <p className="mt-2 text-gray-600">Waiting for partner to request assistance...</p>
        )}
      </div>
    </div>
  );
}