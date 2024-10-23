import React, { useState, useEffect } from "react";
import { usePlayer, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function SwitchesId() {
  const player = usePlayer();
  const round = useRound();
  const [wordList, setWordList] = useState([]);
  const [switchMarks, setSwitchMarks] = useState({});

  useEffect(() => {
    const words = player.round.get("words") || [];
    const simplifiedWords = words.map((word, index) => ({
      id: index,
      text: word.text,
      isSwitch: false
    }));
    setWordList(simplifiedWords);
    
    // Initialize switchMarks with first word always marked
    setSwitchMarks({ 0: true });
 }, []);

  const toggleSwitch = (id) => {
    
    // Don't allow toggling the first word
    if (id === 0) return;

    setSwitchMarks(prev => {
      const newMarks = { ...prev };
      newMarks[id] = !newMarks[id];
      return newMarks;
    });
  };

  const handleContinue = () => {
    // Create an array of words with their index and switch value (0 or 1)
    const markedWords = wordList.map((word) => ({
      index: word.id,
      word: word.text,
      switch: word.id === 0 ? 1 : (switchMarks[word.id] ? 1 : 0)
    }));
    
    player.round.set("switches", markedWords);
    player.stage.set("submit", true);
  };

  return (
    <div className="flex flex-col items-center justify-start h-full max-w-3xl mx-auto px-4 pt-8">
      <h2 className="text-2xl font-bold mb-6">Identify Word Groups</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center max-w-2xl">
        <p className="text-gray-700 leading-relaxed text-justify">
          You might find that you listed some words in a row that were related to each other in some way. 
          <span className="font-bold"> Place an X next to each word that you think starts a grouping of related words. </span> If you feel as 
          though several words in a row are not related to each other in some way, you can continue to 
          place an X next to those words. There is no right or wrong answer; people have different 
          opinions about the way in which words are related.
        </p>
      </div>

      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 mb-8 max-w-xl">
        <div className="h-72 overflow-y-auto p-4">
          {wordList.map((word) => (
            <div
              key={word.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg mr-4">{word.text}</span>
              <button
                onClick={() => toggleSwitch(word.id)}
                disabled={word.id === 0}
                className={`w-8 h-8 flex items-center justify-center rounded border ${
                  word.id === 0 
                    ? 'border-blue-500 bg-blue-50 text-blue-500 cursor-not-allowed opacity-75'
                    : switchMarks[word.id]
                    ? 'border-blue-500 bg-blue-50 text-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {word.id === 0 || switchMarks[word.id] ? 'X' : ''}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <Button handleClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}