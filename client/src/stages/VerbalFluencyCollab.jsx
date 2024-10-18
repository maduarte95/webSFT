import React, { useState, useEffect } from "react";
import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

let hintRequestCount = 0;
let lastHintRequestTime = 0;

export function VerbalFluencyCollab() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();
  // player.round.set("roundName", "InterleavedLLM");
  const category = player.round.get("category");

  useEffect(() => {
    player.round.set("roundName", "InterleavedLLM");
    console.log(`Component rendered. Start time: ${stage.get("serverStartTime")}, Current time: ${Date.now()}`);
  }, []);

  useEffect(() => {
    const words = player.round.get("words") || [];
    const totalWordCount = words.length;
    player.round.set("score", totalWordCount);

    //new
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      setLastWord(`${lastSavedWord.source === 'user' ? 'You' : 'Partner'}: ${lastSavedWord.text}`);
    }

  }, [player.round.get("words")]);

  useEffect(() => {
    const response = player.stage.get("apiResponse");
    if (response) {
      handleAIResponse(response);
    }
  }, [player.stage.get("apiResponse")]);

  async function getServerTimestamp() {
    console.log("Requesting server timestamp");
    player.set("requestTimestamp", true);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return new Promise((resolve) => {
      const checkTimestamp = () => {
        const timestamp = player.get("serverTimestamp");
        if (timestamp !== undefined) {
          console.log("Received server timestamp:", timestamp);
          resolve(timestamp);
        } else {
          setTimeout(checkTimestamp, 50);
        }
      };
      checkTimestamp();
    });
  }

  async function handleSendWord() {
    if (currentWord.trim() === "" || isWaitingForAI) return;
  
    const clientStartTime = Date.now();
    console.log(`Word submission initiated at client time: ${clientStartTime}`);
  
    const timestamp = await getServerTimestamp();
    const serverStartTime = stage.get("serverStartTime");
    const clientEndTime = Date.now();
  
    console.log(`Word submission details:
      Word: ${currentWord.trim()}
      Request start time: ${clientStartTime}
      Request end time: ${clientEndTime}
      Request duration: ${clientEndTime - clientStartTime}ms
      Server timestamp: ${timestamp}
      Server start time: ${serverStartTime}
      Elapsed time since stage start: ${timestamp - serverStartTime}ms`);
  
    if (serverStartTime && timestamp) {
      const relativeTimestamp = timestamp - serverStartTime;
      const words = player.round.get("words") || [];
      const updatedWords = [...words, { 
        text: currentWord.trim(), 
        source: 'user', 
        timestamp: relativeTimestamp 
      }];
      player.round.set("words", updatedWords);
      player.round.set("lastWord", currentWord.trim());
      // setCurrentWord("");
      setLastWord(`You: ${currentWord.trim()}`);
      setCurrentWord("");
  
  
      console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
      triggerAIResponse();
    } else {
      console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
    }
  }

  async function triggerAIResponse() {
    hintRequestCount++;
    const clientStartTime = Date.now();
    console.log(`AI response request #${hintRequestCount} initiated at client time: ${clientStartTime}`);

    setIsWaitingForAI(true);
    const timestamp = await getServerTimestamp();
    const serverStartTime = stage.get("serverStartTime");
    const clientEndTime = Date.now();

    console.log(`AI response request #${hintRequestCount} details:
      Request start time: ${clientStartTime}
      Request end time: ${clientEndTime}
      Request duration: ${clientEndTime - clientStartTime}ms
      Server timestamp: ${timestamp}
      Server start time: ${serverStartTime}
      Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

    if (serverStartTime && timestamp) {
      const relativeTimestamp = timestamp - serverStartTime;
      const requestTimestamps = player.round.get("requestTimestamps") || [];
      const updatedTimestamps = [...requestTimestamps, relativeTimestamp];
      player.round.set("requestTimestamps", updatedTimestamps);
      console.log(`Updated timestamps for request #${hintRequestCount}: ${JSON.stringify(updatedTimestamps)}`);

      lastHintRequestTime = timestamp;

      try {
        await player.set("apiTrigger", true);
      } catch (error) {
        console.error("Failed to trigger API call", error);
        setIsWaitingForAI(false);
      }
    } else {
      console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
      setIsWaitingForAI(false);
    }
  }

  async function handleAIResponse(response) {
    const timestamp = await getServerTimestamp();
    const serverStartTime = stage.get("serverStartTime");

    if (serverStartTime && timestamp && lastHintRequestTime) {
      const relativeTimestamp = timestamp - serverStartTime;
      const apiLatency = timestamp - lastHintRequestTime;

      console.log(`LLM API Response Latency: ${apiLatency}ms`);

      const words = player.round.get("words") || [];
      const updatedWords = [...words, { 
        text: response, 
        source: 'ai', 
        timestamp: relativeTimestamp,
        apiLatency: apiLatency
      }];
      player.round.set("words", updatedWords);
      setLastWord(`Partner: ${response}`);
      setIsWaitingForAI(false);
      player.stage.set("apiResponse", null);

      console.log(`AI response added. Updated words: ${JSON.stringify(updatedWords)}`);
    } else {
      console.error("Invalid timestamp or start time for AI response", { timestamp, serverStartTime, lastHintRequestTime });
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendWord();
    }
  }

  const words = player.round.get("words") || [];

  // return (
  //   <div className="flex flex-col items-center justify-center h-full">
  //     <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
  //     <div className="w-full max-w-md">
  //       <ul className="mb-4 h-60 overflow-y-auto border border-gray-300 rounded p-2">
  //         {words.map((word, index) => (
  //           <li key={index} className={`text-xl ${word.source === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
  //             {word.source === 'user' ? 'You: ' : 'AI: '}{word.text}
  //           </li>
  //         ))}
  //       </ul>
  //       <div className="flex items-center">
  //         <input
  //           value={currentWord}
  //           onChange={(e) => setCurrentWord(e.target.value)}
  //           onKeyDown={handleKeyDown}
  //           placeholder="Enter an animal name..."
  //           className="flex-grow p-2 border border-gray-300 rounded mr-2"
  //           disabled={isWaitingForAI}
  //         />
  //         <Button handleClick={handleSendWord} disabled={isWaitingForAI || currentWord.trim() === ""}>
  //           Send
  //         </Button>
  //       </div>
  //       {isWaitingForAI && <p className="mt-2 text-gray-600">Waiting for AI response...</p>}
  //     </div>
  //   </div>
  // );

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
      <div className="mt-8 text-4xl font-bold mb-8">
        {lastWord || "No words yet"}
      </div>
      <div className="w-full max-w-md">
        <div className="flex items-center mb-4">
          <input
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter an item..."
            className="flex-grow p-2 border border-gray-300 rounded mr-2"
            disabled={isWaitingForAI}
          />
          <Button handleClick={handleSendWord} disabled={isWaitingForAI || currentWord.trim() === ""}>
            Send
          </Button>
        </div>
        {isWaitingForAI && <p className="mt-2 text-gray-600">Waiting for partner's hint...</p>}
      </div>
    </div>
  );
}