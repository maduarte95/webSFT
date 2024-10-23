import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";

export function FinalScoreSummary({ next }) {
  const player = usePlayer();
  const score = player.get("score") || 0;
  const bonusRate = 0.01; // $0.01 per point
  const totalBonus = (score * bonusRate).toFixed(2); // Format to 2 decimal places

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-4">Experiment Complete!</h2>
        <div className="space-y-2 text-center text-gray-600">
          <p className="text-xl">
            Total Score: <span className="font-bold">{score}</span>
          </p>
          <p className="text-xl">
            Bonus Amount: <span className="font-bold">${totalBonus}</span>
            <span className="text-sm ml-2">($0.01 per point)</span>
          </p>
        </div>
      </div>

      <Alert title="Payment Information">
        <p>
          Please submit the following code to receive your payment:{" "}
          <strong>{player.id}</strong>
        </p>
        <p className="pt-1">
          You will receive a <strong>${totalBonus} bonus</strong> in addition to the{" "}
          <strong> base reward</strong> for completing the HIT.
        </p>
        {/* <p className="pt-1 text-sm text-gray-600">
          Your bonus was calculated at $0.01 per point based on your total score of {score} points.
        </p> */}
      </Alert>

      <div className="mt-8 flex justify-center">
        <Button handleClick={next}>Continue</Button>
      </div>
    </div>
  );
}