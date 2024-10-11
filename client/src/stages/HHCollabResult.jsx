import React from 'react';
import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function HHCollabResult() {
  const player = usePlayer();
  const players = usePlayers();
  const partner = players.find(p => p.id !== player.id);
  const round = useRound();
  const words = round.get("words") || [];

  const mainWords = words.filter(word => word.source === 'main');
  const helperWords = words.filter(word => word.source === 'helper');

  const totalWordCount = words.length;
  const mainWordCount = mainWords.length;
  const helperWordCount = helperWords.length;

  const score = player.round.get("score") || 0; //both players' score is the main player's word count

  function handleContinue() {
    player.stage.set("submit", true);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-5xl font-bold mb-8">Collaboration Summary</h1>
      <div className="flex w-full justify-center">
        <div className="w-1/2 p-4">
          <h2 className="text-3xl font-bold mb-4">Main Player's Words</h2>
          <ul className="list-disc list-inside">
            {mainWords.map((word, index) => (
              <li key={index} className="text-xl">{word.text}</li>
            ))}
          </ul>
        </div>
        <div className="w-1/2 p-4">
          <h2 className="text-3xl font-bold mb-4">Helper's Words</h2>
          <ul className="list-disc list-inside">
            {helperWords.map((word, index) => (
              <li key={index} className="text-xl">{word.text}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-3xl font-bold mb-4">Collaboration Statistics</h2>
        <p className="text-xl">Total Words: {totalWordCount}</p>
        <p className="text-xl">Main Player's Words: {mainWordCount}</p>
        <p className="text-xl">Helper's Words: {helperWordCount}</p>
        <p className="text-xl">Collaboration Score: {score}</p>
      </div>
      <Button handleClick={handleContinue} className="mt-8">Continue</Button>
    </div>
  );
}
