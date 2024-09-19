import React from 'react';
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function VFCollabResult() {
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
      <h1 className="text-5xl font-bold mb-8">Collaboration Summary</h1>
      <div className="flex w-full justify-center">
        <div className="w-1/2 p-4">
          <h2 className="text-3xl font-bold mb-4">Your Words</h2>
          <ul className="list-disc list-inside">
            {userWords.map((word, index) => (
              <li key={index} className="text-xl">{word.text}</li>
            ))}
          </ul>
        </div>
        <div className="w-1/2 p-4">
          <h2 className="text-3xl font-bold mb-4">AI Words</h2>
          <ul className="list-disc list-inside">
            {aiWords.map((word, index) => (
              <li key={index} className="text-xl">{word.text}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-3xl font-bold mb-4">Collaboration Statistics</h2>
        <p className="text-xl">Total Words: {totalWordCount}</p>
        <p className="text-xl">Your Words: {userWordCount}</p>
        <p className="text-xl">AI Words: {aiWordCount}</p>
        <p className="text-xl">Collaboration Score: {score}</p>
      </div>
      <Button handleClick={handleContinue} className="mt-8">Continue</Button>
    </div>
  );
}