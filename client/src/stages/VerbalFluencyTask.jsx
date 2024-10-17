import React, { useState, useEffect } from "react";
import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

let hintRequestCount = 0;
let lastHintRequestTime = 0;

export function VerbalFluencyTask() {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();
  const category = player.round.get("category");
  
  useEffect(() => {
    player.round.set("roundName", "SelfInitiatedLLM");
    console.log(`Component rendered. Start time: ${stage.get("serverStartTime")}, Current time: ${Date.now()}`);
  }, []);

  useEffect(() => {
    const savedWords = player.round.get("words") || [];
    setWords(savedWords);
    const lastSavedWord = savedWords[savedWords.length - 1];
    if (lastSavedWord) {
      setLastWord(lastSavedWord.source === 'ai' ? `AI Hint: ${lastSavedWord.text}` : lastSavedWord.text);
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
    if (currentWord.trim() === "") return;

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
      const updatedWords = [...words, { 
        text: currentWord.trim(), 
        source: 'user', 
        timestamp: relativeTimestamp 
      }];
      setWords(updatedWords);
      player.round.set("words", updatedWords);
      player.round.set("lastWord", currentWord.trim());
      setLastWord(currentWord.trim());
      setCurrentWord("");
  
      const userWordCount = updatedWords.filter(word => word.source === 'user').length;
      player.round.set("score", userWordCount);

      console.log(`Updated words: ${JSON.stringify(updatedWords)}`);
    } else {
      console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
    }
  }

  async function getHint() {
    hintRequestCount++;
    const clientStartTime = Date.now();
    console.log(`Hint request #${hintRequestCount} initiated at client time: ${clientStartTime}`);

    setIsLoading(true);
    const timestamp = await getServerTimestamp();
    const serverStartTime = stage.get("serverStartTime");
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
      const requestTimestamps = player.round.get("requestTimestamps") || [];
      const updatedTimestamps = [...requestTimestamps, relativeTimestamp];
      player.round.set("requestTimestamps", updatedTimestamps);
      console.log(`Updated timestamps for request #${hintRequestCount}: ${JSON.stringify(updatedTimestamps)}`);

      lastHintRequestTime = timestamp; // Store the timestamp of the last hint request

      try {
        await player.set("apiTrigger", true);
      } catch (error) {
        console.error("Failed to trigger API call", error);
        setIsLoading(false);
      }
    } else {
      console.error("Invalid timestamp or start time", { timestamp, serverStartTime });
      setIsLoading(false);
    }
  }

  async function handleAIResponse(response) {
    const timestamp = await getServerTimestamp();
    const serverStartTime = stage.get("serverStartTime");

    if (serverStartTime && timestamp && lastHintRequestTime) {
      const relativeTimestamp = timestamp - serverStartTime;
      const apiLatency = timestamp - lastHintRequestTime;

      console.log(`LLM API Response Latency: ${apiLatency}ms`);

      const updatedWords = [...words, { 
        text: response, 
        source: 'ai', 
        timestamp: relativeTimestamp,
        apiLatency: apiLatency
      }];
      setWords(updatedWords);
      player.round.set("words", updatedWords);
      setLastWord(`AI Hint: ${response}`);
      setIsLoading(false);
      player.stage.set("apiResponse", null);

      console.log(`AI response added. Updated words: ${JSON.stringify(updatedWords)}`);
    } else {
      console.error("Invalid timestamp or start time for AI response", { timestamp, serverStartTime, lastHintRequestTime });
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendWord();
    } else if (event.key === "ArrowUp") {
      getHint();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Name as many items as you can: {category}</h2>
      <div className="mt-8 text-4xl font-bold">
        {lastWord}
      </div>
      <div className="flex flex-col items-center mt-8">
        <input
          value={currentWord}
          onChange={(e) => setCurrentWord(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter an animal name..."
          className="mb-4 p-2 border border-gray-300 rounded"
        />
        <div className="flex space-x-4">
          <Button handleClick={handleSendWord}>Send</Button>
          <Button handleClick={getHint} disabled={isLoading}>
            {isLoading ? "Loading..." : "Hint"}
          </Button>
        </div>
      </div>
    </div>
  );
}