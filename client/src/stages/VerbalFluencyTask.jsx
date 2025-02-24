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