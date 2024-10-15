import React, { useState, useEffect } from "react";
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
  player.round.set("roundName", "SelfiInitiatedLLM");

  useEffect(() => {
    const savedWords = player.round.get("words") || [];
    setWords(savedWords);
    const lastSavedWord = savedWords[savedWords.length - 1];
    if (lastSavedWord) {
      setLastWord(lastSavedWord.source === 'ai' ? `AI Hint: ${lastSavedWord.text}` : lastSavedWord.text);
    }
  }, [player.round]);

  
  // Also update the useEffect that handles AI responses
  useEffect(() => {
    const checkForResponse = () => {
      const response = player.stage.get("apiResponse");
      if (response) {
        const startTime = stage.get("startTime");
        if (!startTime) {
          console.error("Start time is not set yet.");
          return;
        }
        const timestamp = Date.now() - startTime;
        setWords((currentWords) => {
          const updatedWords = [...currentWords, { text: response, source: 'ai', timestamp }];
          player.round.set("words", updatedWords);
          return updatedWords;
        });
        setLastWord(`AI Hint: ${response}`);
        setIsLoading(false);
        player.stage.set("apiResponse", null);
      }
    };
  
    // const intervalId = setInterval(checkForResponse, 1000);
    // return () => clearInterval(intervalId);
  }, [player.stage, player.round]);


  async function getHint() {
     //make a requestTimestamp list and save to player.round; not saved to round because players play independently
     const startTime = stage.get("startTime");
     if (!startTime) {
      console.error("Start time is not set yet.");
      return;
    }
  
     const requestTimestamps = player.round.get("requestTimestamps") || [];
     const timestamp = Date.now() - startTime; //giving negative timestamps, why? A: timestamp is calculated before startTime is set why? A: because the startTime is set after the first render
     const updatedTimestamps = [...requestTimestamps, timestamp];
     player.round.set("requestTimestamps", updatedTimestamps);
     //print the requestTimestamps list
     console.log("New hint request!", updatedTimestamps);

    setIsLoading(true);
    try {
      await player.set("apiTrigger", true);
    } catch (error) {
      console.error("Failed to trigger API call", error);
      setIsLoading(false);
    }
  }


  function handleSendWord() {
    if (currentWord.trim() === "") return;
    const startTime = stage.get("startTime");

    if (!startTime) {
      console.error("Start time is not set yet.");
      return;
    }
    const timestamp = Date.now() - startTime;
  
    const updatedWords = [...words, { text: currentWord.trim(), source: 'user', timestamp }];
    setWords(updatedWords);
    player.round.set("words", updatedWords);
    player.round.set("lastWord", currentWord.trim());
    setLastWord(currentWord.trim());
    setCurrentWord("");
  
    const userWordCount = updatedWords.filter(word => word.source === 'user').length;
    player.round.set("score", userWordCount);
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
      <h2 className="text-3xl font-bold mb-8">Animals</h2>
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