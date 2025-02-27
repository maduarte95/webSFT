import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function VerbalFluencyCollab() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();
  const category = player.round.get("category");
  const inputRef = useRef(null);

  // NEW: Track pending API responses to prevent lost responses
  const pendingResponseRef = useRef(false);
  // NEW: Synchronous submission lock
  const isSubmittingRef = useRef(false);

  // Wait for serverStartTime before rendering interactive elements
  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    // When isWaitingForAI becomes false, focus the input
    if (!isWaitingForAI && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForAI]);  

  useEffect(() => {
    player.round.set("roundName", "InterleavedLLM");
    console.log(`Component rendered. Start time: ${stage.get("serverStartTime")}, Current time: ${Date.now()}`);
  }, []);

  useEffect(() => {
    const words = player.round.get("words") || [];
    const totalWordCount = words.length;
    player.round.set("score", totalWordCount);

    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      setLastWord(`${lastSavedWord.source === 'user' ? 'You' : 'Partner'}: ${lastSavedWord.text}`);
    }
  }, [player.round.get("words")]);

  useEffect(() => {
    const response = player.stage.get("apiResponse");
    if (response && (isWaitingForAI || pendingResponseRef.current)) {
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
    const maxAttempts = 300;
    
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
    if (currentWord.trim() === "" || isWaitingForAI || isSubmittingRef.current) {
      return;
    }
    
    // Immediately lock submissions and capture word
    isSubmittingRef.current = true;
    const wordToSubmit = currentWord.trim();
    setCurrentWord(""); // Clear input immediately
  
    try {

      // Check for duplicates before setting waiting state
      const words = player.round.get("words") || [];
      const isDuplicate = words.some(w =>
        w.text.toLowerCase() === wordToSubmit.toLowerCase() &&
        w.source === 'user'
      );

      if (isDuplicate) {
        console.log(`Duplicate word rejected: ${wordToSubmit}`);
        setLastWord(`"${wordToSubmit}" was already used!`);
        return;  // Exit early without setting isWaitingForAI
      }

      // Set waiting state if no duplicates
      setIsWaitingForAI(true);
      console.log(`[Player ${player.id}] Starting word submission`);

      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("No timestamp received");
      }
  
      console.log(`[Player ${player.id}] Got timestamp: ${timestamp}`);
      
      if (!serverStartTime) {
        throw new Error("No server start time available");
      }

      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error(`Invalid relative timestamp: ${relativeTimestamp}`);
      }

      // Check if player took too long to respond to the last word
      if (words.length > 0) {
        const lastWord = words[words.length - 1];
        const responseDelay = relativeTimestamp - lastWord.timestamp;
        if (responseDelay > 10000) { // 10 seconds in milliseconds
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + 1);
          console.log(`Slow response penalty applied: ${responseDelay}ms`);
        }
      }
  
      const updatedWords = [...words, {
        text: wordToSubmit,
        source: 'user',
        timestamp: relativeTimestamp
      }];
 
      await player.round.set("words", updatedWords);
      await player.round.set("lastWord", wordToSubmit);  // Changed from currentWord.trim()
      setLastWord(`You: ${wordToSubmit}`);  // Changed from currentWord.trim()

      console.log(`[Player ${player.id}] Word submission complete:`, {
        word: wordToSubmit,  // Changed from currentWord.trim()
        timestamp,
        serverStartTime,
        relativeTimestamp
      });
      
      console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
      await triggerAIResponse();
    
    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
      setIsWaitingForAI(false); // Reset waiting state on error
    } finally {
      isSubmittingRef.current = false;
    }
  }


  async function triggerAIResponse() {
    try {
        if (player.get("apiTrigger")) {
            console.log("API call already in progress");
            return;
        }

        // Get and validate timestamp before any state changes
        const timestamp = await getServerTimestamp();
        if (!timestamp) {
            throw new Error("Failed to get timestamp for AI request");
        }

        const relativeTimestamp = timestamp - serverStartTime;
        if (relativeTimestamp < 0) {
            throw new Error("Invalid relative timestamp");
        }

        // Track that we're expecting a response
        pendingResponseRef.current = true;

        // Record request timestamp
        const requestTimestamps = player.round.get("requestTimestamps") || [];
        const updatedTimestamps = [...requestTimestamps, relativeTimestamp];

        // Atomic updates
        await Promise.all([
            player.round.set("requestTimestamps", updatedTimestamps),
            player.set("apiTrigger", true)
        ]);

    } catch (error) {
        console.error(`[Player ${player.id}] Failed to trigger AI response:`, error); //TODO: consider saving error to player state
        // Clean up all states if API trigger fails
        setIsWaitingForAI(false);
        pendingResponseRef.current = false;
        await player.set("apiTrigger", false);
    }
}

  async function handleAIResponse(response) {
    console.log("Handling AI response:", response);
    pendingResponseRef.current = false;

    const words = player.round.get("words") || [];
    const updatedWords = [...words, { 
      text: response.text, 
      source: 'ai', 
      timestamp: response.timestamp - serverStartTime, //timestamp comes from server - change this so it's the same as user timestamp ? 
      apiLatency: response.apiLatency
    }];

    console.log("AI response timestamp since start of task:", response.timestamp, "setting words");

    //DEBUG FEB 19 - log the response timestamp obtained the same way as the user timestamp (with get server timestamp function) to see if they're the same
    const alternativeTimestamp = await getServerTimestamp();
    console.log("Alternative client-side absolute timestamp:", alternativeTimestamp);
    const alternativeLatency = alternativeTimestamp - serverStartTime;
    console.log("Alternative client-side stage timestamp since start of task:", alternativeLatency); //pretty similar to the server timestamp! will only be off if server-client communication is slow
    //END DEBUG
    
    await player.round.set("words", updatedWords);
    setLastWord(`Partner: ${response.text}`);
    setIsWaitingForAI(false);
    await player.stage.set("apiResponse", null);

    console.log("AI response processed. Updated words:", updatedWords);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.repeat) {
      event.preventDefault();
      handleSendWord();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-6">Name as many items as you can: {category}</h2>
      
      <div className="w-full max-w-2xl p-6 bg-gray-50 rounded-lg shadow-md mb-8">
        <div className="text-center">
          {lastWord ? (
            <div className="flex flex-col items-center mb-4">
              <div className="text-sm uppercase tracking-wide text-gray-500 mb-1">
                {lastWord.startsWith('You:') ? 'Your last word' : 'Partner\'s last word'}
              </div>
              <div className={`text-4xl font-bold ${lastWord.startsWith('You:') ? 'text-slate-600' : 'text-slate-800'}`}>
                {lastWord.replace(/^(You:|Partner:)\s/, '')}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {lastWord.startsWith('You:') ? 'Your turn again' : 'Your turn'}
              </div>
            </div>
          ) : (
            <div className="text-2xl text-gray-600 mb-6">No words yet - start the conversation!</div>
          )}
        </div>
        
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-500 mb-2 text-center">Word History</div>
          <div className="max-h-32 overflow-y-auto px-4">
            {(player.round.get("words") || []).map((word, index) => (
              <div key={index} className="text-center mb-2">
                <span className={`font-medium ${word.source === 'user' ? 'text-slate-600' : 'text-slate-800'}`}>
                  {word.source === 'user' ? 'You' : 'Partner'}:
                </span>
                <span className={`ml-2 text-lg ${word.source === 'user' ? 'text-slate-600' : 'text-slate-800'}`}>
                  {word.text}
                </span>
              </div>
            ))}
          </div>
        </div>
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
            className={`flex-grow p-3 text-lg border rounded-l-lg focus:outline-none focus:ring-2 ${
              isWaitingForAI || isSubmittingRef.current
                ? 'bg-gray-100 border-gray-300 text-gray-500'
                : 'border-blue-300 focus:ring-blue-500'
            }`}
            disabled={isWaitingForAI || isSubmittingRef.current}
            autoFocus
          />
          <Button 
            handleClick={handleSendWord} 
            disabled={isWaitingForAI || isSubmittingRef.current || currentWord.trim() === ""}
          >
            Send
          </Button>
        </div>
        
        <div className="text-center">
          {!isWaitingForAI ? (
            <p className="text-lg font-medium text-emerald-600">It's your turn!</p>
          ) : (
            <p className="text-lg font-medium text-gray-600">Waiting for your partner...</p>
          )}
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="flex flex-col items-center justify-center h-full">
  //     <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
  //     <div className="mt-8 text-4xl font-bold mb-8">
  //       {lastWord || "No words yet"}
  //     </div>
  //     <div className="w-full max-w-md">
  //       <div className="flex items-center mb-4">
  //         <input
  //           ref={inputRef}  // Add this line
  //           value={currentWord}
  //           onChange={(e) => setCurrentWord(e.target.value)}
  //           onKeyDown={handleKeyDown}
  //           placeholder="Enter an item..."
  //           className="flex-grow p-2 border border-gray-300 rounded mr-2"
  //           disabled={isWaitingForAI || isSubmittingRef.current}
  //           autoFocus
  //         />
  //         <Button 
  //           handleClick={handleSendWord} 
  //           disabled={isWaitingForAI || isSubmittingRef.current || currentWord.trim() === ""}
  //         >
  //           Send
  //         </Button>
  //       </div>
  //       {!isWaitingForAI ? (
  //         <p className="mt-2 text-green-600">It's your turn!</p>
  //       ) : (
  //         <p className="mt-2 text-gray-600">Waiting for your partner...</p>
  //       )}
  //     </div>
  //   </div>
  // );
}