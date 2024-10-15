import React, { useState, useEffect } from "react";
import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function VerbalFluencyCollab() {
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();
  player.round.set("roundName", "InterleavedLLM");

  useEffect(() => {
    const savedWords = player.round.get("words") || [];
    setWords(savedWords);
  }, [player.round]);

  useEffect(() => {
    const checkForResponse = () => {
      const response = player.stage.get("apiResponse");
      if (response) {
        const startTime = stage.get("startTime");
        const timestamp = Date.now() - startTime;
        setWords((currentWords) => {
          const updatedWords = [...currentWords, { text: response, source: 'ai', timestamp }];
          player.round.set("words", updatedWords);
          return updatedWords;
        });
        setIsWaitingForAI(false);
        player.stage.set("apiResponse", null);
      }
    };
  
    // const intervalId = setInterval(checkForResponse, 1000);
    // return () => clearInterval(intervalId);
  }, [player.stage, player.round]);

  async function triggerAIResponse() {
    setIsWaitingForAI(true);
    try {
      await player.set("apiTrigger", true);
    } catch (error) {
      console.error("Failed to trigger API call", error);
      setIsWaitingForAI(false);
    }
  }


  function handleSendWord() {
    if (currentWord.trim() === "" || isWaitingForAI) return;
  
    const startTime = stage.get("startTime");
    const timestamp = Date.now() - startTime;
  
    const updatedWords = [...words, { text: currentWord.trim(), source: 'user', timestamp }];
    setWords(updatedWords);
    player.round.set("words", updatedWords);
    player.round.set("lastWord", currentWord.trim());
    setCurrentWord("");
    triggerAIResponse();
  
    const totalWordCount = updatedWords.length;
    player.round.set("score", totalWordCount);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSendWord();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-8">Collaborative Animal Naming</h2>
      <div className="w-full max-w-md">
        <ul className="mb-4 h-60 overflow-y-auto border border-gray-300 rounded p-2">
          {words.map((word, index) => (
            <li key={index} className={`text-xl ${word.source === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
              {word.source === 'user' ? 'You: ' : 'AI: '}{word.text}
            </li>
          ))}
        </ul>
        <div className="flex items-center">
          <input
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter an animal name..."
            className="flex-grow p-2 border border-gray-300 rounded mr-2"
            disabled={isWaitingForAI}
          />
          <Button handleClick={handleSendWord} disabled={isWaitingForAI || currentWord.trim() === ""}>
            Send
          </Button>
        </div>
        {isWaitingForAI && <p className="mt-2 text-gray-600">Waiting for AI response...</p>}
      </div>
    </div>
  );
}