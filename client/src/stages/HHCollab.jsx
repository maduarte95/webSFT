import React, { useState, useEffect } from "react";
import { usePlayer, usePlayers, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

let hintRequestCount = 0;

export function HHCollab() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const player = usePlayer();
  const players = usePlayers();
  const partner = players.find(p => p.id !== player.id);
  const isMain = player.get("role") === "main";
  const round = useRound();
  const stage = useStage();
  console.log(`Component rendered. Start time: ${stage.get("serverStartTime")}, Current time: ${Date.now()}`);

  useEffect(() => {
    const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      setLastWord(lastSavedWord.source === 'helper' ? `Assistant: ${lastSavedWord.text}` : lastSavedWord.text);
    }
    player.round.set("score", words.filter(word => word.source === 'main').length); //set both players' score to main player's word count   
  }, [round.get("words")]); //updates when words change


  async function getServerTimestamp() {
    console.log("Requesting server timestamp");
    player.set("requestTimestamp", true);
    
    // Add a small delay to ensure the server processes the request
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



// function handleSendWord() {
//   if (currentWord.trim() === "" || (isMain && round.get("waitingForAssistant"))) return;

//   const timestamp = getServerTimestamp();
//   const serverStartTime = stage.get("serverStartTime");
//   const relativeTimestamp = timestamp - serverStartTime;

//   const words = round.get("words") || [];
//   const updatedWords = [...words, { 
//     text: currentWord.trim(), 
//     source: isMain ? 'main' : 'helper', 
//     timestamp: relativeTimestamp 
//   }];
//   round.set("words", updatedWords);
//   setCurrentWord("");

//   if (!isMain) {
//     round.set("waitingForAssistant", false);
//   }
// }

async function handleSendWord() {
  if (currentWord.trim() === "" || (isMain && round.get("waitingForAssistant"))) return;

  const clientStartTime = Date.now();
  console.log(`Word submission initiated at client time: ${clientStartTime}`);

  const timestamp = await getServerTimestamp();
  const serverStartTime = stage.get("startTime") || stage.get("serverStartTime");
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
    const words = round.get("words") || [];
    const updatedWords = [...words, { 
      text: currentWord.trim(), 
      source: isMain ? 'main' : 'helper', 
      timestamp: relativeTimestamp 
    }];
    round.set("words", updatedWords);
    setCurrentWord("");

    if (!isMain) {
      round.set("waitingForAssistant", false);
    }

    console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
  } else {
    console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
  }
}

  async function handleRequestHint() {
    hintRequestCount++;
    const clientStartTime = Date.now();
    console.log(`Hint request #${hintRequestCount} initiated at client time: ${clientStartTime}`);
    
    round.set("waitingForAssistant", true);
    const timestamp = await getServerTimestamp();
    const serverStartTime = stage.get("startTime") || stage.get("serverStartTime");
    const clientEndTime = Date.now();

    console.log(`Hint request #${hintRequestCount} details:
      Request start time: ${clientStartTime}
      Request end time: ${clientEndTime}
      Request duration: ${clientEndTime - clientStartTime}ms
      Server timestamp: ${timestamp}
      Server start time: ${serverStartTime}
      Elapsed time since stage start: ${timestamp - serverStartTime}ms`);

    if (serverStartTime && timestamp) {
      const relativeTimestamp = timestamp - serverStartTime;
      const requestTimestamps = round.get("requestTimestamps") || [];
      const updatedTimestamps = [...requestTimestamps, relativeTimestamp];
      round.set("requestTimestamps", updatedTimestamps);
      console.log(`Updated timestamps for request #${hintRequestCount}: ${JSON.stringify(updatedTimestamps)}`);
    } else {
      console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendWord();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Collaborative Animal Naming</h2>
      <div className="mt-8 text-4xl font-bold mb-8">
        {lastWord || "No words yet"}
      </div>
      <div className="w-full max-w-md">
        <div className="flex items-center mb-4">
          <input
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMain ? "Enter an animal name..." : "Enter your hint..."}
            className="flex-grow p-2 border border-gray-300 rounded mr-2"
            disabled={(isMain && round.get("waitingForAssistant")) || (!isMain && !round.get("waitingForAssistant"))}
          />
          <Button 
            handleClick={handleSendWord} 
            disabled={(isMain && round.get("waitingForAssistant")) || (!isMain && !round.get("waitingForAssistant")) || currentWord.trim() === ""}
          >
            Send
          </Button>
        </div>
        {isMain && (
          <Button 
            handleClick={handleRequestHint} 
            disabled={round.get("waitingForAssistant")}
          >
            Request Hint
          </Button>
        )}
        {round.get("waitingForAssistant") && isMain && <p className="mt-2 text-gray-600">Waiting for assistant's hint...</p>}
        {!isMain && round.get("waitingForAssistant") && <p className="mt-2 text-gray-600">The main player needs your help! Please provide a hint.</p>}
        {!isMain && !round.get("waitingForAssistant") && <p className="mt-2 text-gray-600">Waiting for the main player to request assistance...</p>}
      </div>
    </div>
  );
}