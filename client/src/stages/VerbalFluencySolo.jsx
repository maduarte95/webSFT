import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { TimeProgressBar } from "../components/TimeProgressBar";

export function VerbalFluencySolo() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();
  const category = player.round.get("category");
  const inputRef = useRef(null);
  const wordHistoryRef = useRef(null);
  const isSubmittingRef = useRef(false);

  // Add state for progress bar - in solo task, always show it
  const [showProgressBar, setShowProgressBar] = useState(true);

  // Wait for serverStartTime before rendering interactive elements
  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  // Add effect to scroll to the bottom of word history
  useEffect(() => {
    if (wordHistoryRef.current) {
      wordHistoryRef.current.scrollTop = wordHistoryRef.current.scrollHeight;
    }
  }, [round.get("words")]);

  // Set focus on input field when component mounts or after submission
  useEffect(() => {
    if (inputRef.current && !isSubmittingRef.current) {
      inputRef.current.focus();
    }
  }, [isSubmittingRef.current]);

  // Log component lifecycle
  useEffect(() => {
    console.log('VerbalFluencySolo mounted:', {
      words: round.get("words"),
      timestamp: Date.now()
    });
    
    // Set round name identifier
    player.round.set("roundName", "VerbalFluencySolo");
  }, []);

  // Update word display and score when words change
  useEffect(() => {
    const words = round.get("words") || [];
    if (words.length > 0) {
      const lastSavedWord = words[words.length - 1];
      setLastWord(`Last word: ${lastSavedWord.text}`);
    }
    player.round.set("score", words.length);
  }, [round.get("words")]);

  async function getServerTimestamp() {
    console.log(`[Player ${player.id}] Requesting server timestamp for stage ${stage.get("name")}`);
    
    player.stage.set("serverTimestamp", undefined);
    player.set("requestTimestamp", true);

    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const checkTimestamp = () => {
        attempts++;
        const timestamp = player.stage.get("serverTimestamp");
        
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
    // Initial validation with refs for synchronous checks
    if (currentWord.trim() === "" || isSubmittingRef.current) {
      return;
    }
    
    // Immediately lock submissions and capture word
    isSubmittingRef.current = true;
    const wordToSubmit = currentWord.trim();
    setCurrentWord(""); // Clear input immediately

    try {
      // Check for duplicates before proceeding
      const words = round.get("words") || [];
      const isDuplicate = words.some(w => 
        w.text.toLowerCase() === wordToSubmit.toLowerCase()
      );

      if (isDuplicate) {
        console.log(`[Player ${player.id}] Duplicate word rejected: ${wordToSubmit}`);
        setLastWord(`"${wordToSubmit}" was already used!`);
        isSubmittingRef.current = false;
        return;
      }

      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("No server timestamp received");
      }

      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error(`Invalid relative timestamp: ${relativeTimestamp}`);
      }

      // Check for slow response
      if (words.length > 0) {
        const lastWord = words[words.length - 1];
        const responseDelay = relativeTimestamp - lastWord.timestamp;
        if (responseDelay > 20000) { // 10 seconds in milliseconds -> 20s
          //   const currentPenalties = player.get("slowResponsePenalties") || 0;
          //   player.set("slowResponsePenalties", currentPenalties + 1);
          //   console.log(`Slow response penalty applied: ${responseDelay}ms`);
          // }
          const delayPoints = Math.floor(responseDelay / 20000);
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + delayPoints);
          console.log(`Slow response penalty applied: ${delayPoints} penalties`);
        }
      }
      
      //add penalty for slow first word too
      if (words.length === 0) {
        const responseDelay = relativeTimestamp;
        if (responseDelay > 20000) { // 10 seconds in milliseconds -> 20s
          const delayPoints = Math.floor(responseDelay / 20000);
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + delayPoints);
          console.log(`Slow response penalty applied to first word: ${delayPoints} penalties`);
        }
      }

      // Reset the progress bar and add word to list 
      setShowProgressBar(false);

      // Add new word to list
      const updatedWords = [...words, {
        text: wordToSubmit,
        player: player.id,
        timestamp: relativeTimestamp,
        absoluteTimestamp: timestamp
      }];

      // Update round data
      round.set("words", updatedWords);

      console.log(`[Player ${player.id}] Word submission complete:`, {
        word: wordToSubmit,
        timestamp: relativeTimestamp
      });

      setTimeout(() => setShowProgressBar(true), 10); // Brief timeout to trigger reset

    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
    } finally {
      isSubmittingRef.current = false;
      // Refocus the input after submission
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-6">Name as many items as you can: {category}</h2>
      
      <div className="w-full max-w-4xl flex mb-8">
        {/* Left side - Word History */}
        <div className="w-1/3 bg-gray-50 rounded-l-lg shadow-md p-4 border-r border-gray-200">
          <div className="text-sm uppercase tracking-wide text-gray-500 mb-2 text-center font-semibold">
            Items You've Named
          </div>
          <div 
            ref={wordHistoryRef}
            className="h-72 overflow-y-auto px-2"
          >
            {(round.get("words") || []).map((word, index) => (
              <div key={index} className="mb-3 pb-2 border-b border-gray-100">
                <span className="block text-lg text-slate-600">
                  {index + 1}. {word.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right side - Current word and input */}
        <div className="w-2/3 bg-gray-50 rounded-r-lg shadow-md p-6">
          <div className="text-center">
            {lastWord ? (
              <div className="flex flex-col items-center mb-6">
                <div className="text-sm uppercase tracking-wide text-gray-500 mb-1">
                  Last word
                </div>
                <div className="text-4xl font-bold text-slate-600">
                  {lastWord.replace(/^Last word: /, '')}
                </div>
              </div>
            ) : (
              <div className="text-2xl text-gray-600 mb-6">Start naming items!</div>
            )}
          </div>
          
          <div className="mt-8">
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
                className="flex-grow p-3 text-lg border rounded-l-lg focus:outline-none focus:ring-2 border-blue-300 focus:ring-blue-500"
                disabled={isSubmittingRef.current}
                autoFocus
              />
              <Button 
                handleClick={handleSendWord} 
                disabled={isSubmittingRef.current || currentWord.trim() === ""}
              >
                Add
              </Button>
            </div>

            {showProgressBar && (
              <TimeProgressBar isActive={true} />
            )}
            
            {/* <div className="text-center mt-4">
              <div className="text-lg">
                <span className="font-medium">Current score: </span>
                <span className="font-bold text-emerald-600">{(round.get("words") || []).length}</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}