import React, { useState, useEffect } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function VerbalFluencyTask() {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const player = usePlayer();

  useEffect(() => {
    const savedWords = player.round.get("words") || [];
    setWords(savedWords);
    const lastSavedWord = savedWords[savedWords.length - 1];
    if (lastSavedWord) {
      setLastWord(lastSavedWord.source === 'ai' ? `AI Hint: ${lastSavedWord.text}` : lastSavedWord.text);
    }
  }, [player.round]);

  useEffect(() => {
    const checkForResponse = () => {
      const response = player.stage.get("apiResponse");
      if (response) {
        setWords((currentWords) => {
          const updatedWords = [...currentWords, { text: response, source: 'ai' }];
          player.round.set("words", updatedWords);
          return updatedWords;
        });
        setLastWord(`AI Hint: ${response}`);
        setIsLoading(false);
        player.stage.set("apiResponse", null); // Clear the response
      }
    };

    const intervalId = setInterval(checkForResponse, 1000);
    return () => clearInterval(intervalId);
  }, [player.stage, player.round]);

  async function getHint() {
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

    const updatedWords = [...words, { text: currentWord.trim(), source: 'user' }];
    setWords(updatedWords);
    player.round.set("words", updatedWords);
    player.round.set("lastWord", currentWord.trim());
    setLastWord(currentWord.trim());
    setCurrentWord("");

    // Update the score (count of user words)
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