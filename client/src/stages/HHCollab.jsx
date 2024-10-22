import React, { useState, useEffect, useRef  } from "react";
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
  const category = player.round.get("category");
  const words = round.get("words") || [];
  const wordListRef = useRef(null);  // to enable autoscroll to bottom of word list

  // Helper function to check if hint request is allowed
  const canRequestHint = () => {
    if (words.length === 0) return true;
    const lastWord = words[words.length - 1];
    return lastWord.source === 'main'; //checks if last word was submitted by main player
  };

  useEffect(() => {
    if (wordListRef.current && !isMain) {
      wordListRef.current.scrollTop = wordListRef.current.scrollHeight;
    }
  }, [words]);

  useEffect(() => {
    // const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      const isOwnWord = (isMain && lastSavedWord.source === 'main') || (!isMain && lastSavedWord.source === 'helper');
      setLastWord(isOwnWord ? `You: ${lastSavedWord.text}` : `Partner: ${lastSavedWord.text}`);
    }
    player.round.set("score", words.filter(word => word.source === 'main').length);
  }, [round.get("words")]);

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

    // Add validation check
    if (!canRequestHint()) {
      return;
    }

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
    // Ass scrollable window for helper only
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
              {words.map((word, index) => (
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
                  ⚠️ Main player needs your help! Please provide a word.
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
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMain ? "Enter an item..." : "Enter your hint..."}
            className={`flex-grow p-2 border rounded mr-2 ${
              !isMain && round.get("waitingForAssistant") 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300'
            }`}
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
            disabled={round.get("waitingForAssistant") || !canRequestHint()}
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
        {!isMain && round.get("waitingForAssistant") && (
          <p className="mt-2 text-gray-600">The main player needs your help! Please provide a word.</p>
        )}
        {!isMain && !round.get("waitingForAssistant") && (
          <p className="mt-2 text-gray-600">Waiting for the main player to request assistance...</p>
        )}
      </div>
    </div>
  );
}