import React from "react";
import { Button } from "../components/Button";

export function IntroductionInterleaved({ next }) {
  return (
    <div className="mt-3 sm:mt-5 p-20">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Instructions for Interleaved Task
      </h3>
      <div className="mt-2 mb-6">
        <p className="text-sm text-gray-500">
          In this experiment, you will alternate turns with a partner (human or AI) to name items in a given category.
          <br />
          The time limit is <strong>3 minutes</strong> for each task.
        </p>
        <p>
          (a) When it's your turn, name an item belonging to the given category.
        </p>
        <p>
          (b) Wait for your partner to provide their answer before your next turn.
        </p>
        <p className="mt-4">
          Your goal is to name as many unique items as possible within the time limit.
        </p>
      </div>
      <Button handleClick={next} autoFocus>
        <p>Next</p>
      </Button>
    </div>
  );
}