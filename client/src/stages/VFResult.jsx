import React from 'react';
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function VFResult() {
  const player = usePlayer();
  const words = player.round.get("words") || [];

  const userWords = words.filter(word => word.source === 'user');
  const aiWords = words.filter(word => word.source === 'ai');

  const totalWordCount = words.length;
  const userWordCount = userWords.length;
  const aiWordCount = aiWords.length;

  const score = player.round.get("score") || 0;

  function handleContinue() {
    player.stage.set("submit", true);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-5xl font-bold mb-8">Summary</h1>
      <div className="flex w-full justify-center">
        <div className="w-1/2 p-4">
          <h2 className="text-3xl font-bold mb-4">Main Player's Words</h2>
          {userWords.length > 0 ? (
            <ul className="list-disc list-inside">
              {userWords.map((word, index) => (
                <li key={index} className="text-xl">{word.text}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xl">No words were submitted.</p>
          )}
        </div>
        <div className="w-1/2 p-4">
          <h2 className="text-3xl font-bold mb-4">Helper's words</h2>
          {aiWords.length > 0 ? (
            <ul className="list-disc list-inside">
              {aiWords.map((word, index) => (
                <li key={index} className="text-xl">{word.text}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xl">No hints were requested.</p>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-3xl font-bold mb-4">Statistics</h2>
        <p className="text-xl">Total Words: {totalWordCount}</p>
        <p className="text-xl">Your Words: {userWordCount}</p>
        <p className="text-xl">Partner's words: {aiWordCount}</p>
        <p className="text-xl">Your Score: {score}</p>
      </div>
      <Button handleClick={handleContinue} className="mt-8">Continue</Button>
    </div>
  );
}