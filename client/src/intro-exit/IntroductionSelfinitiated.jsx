import React from "react";
import { Button } from "../components/Button";

export function IntroductionSelfinitiated({ next }) {
  return (
    <div className="mt-3 sm:mt-5 p-20">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Instructions for Self-Initiated Task
      </h3>
      <div className="mt-2 mb-6">
        <p className="text-sm text-gray-500">
          In this experiment, you will name items in a given category and can request help from a partner (human or AI) when needed.
          <br />
          The time limit is <strong>3 minutes</strong> for each task.
        </p>
        <p>
          (a) Name as many items as you can think of belonging to the given category.
        </p>
        <p>
          (b) If you need help, you can request a hint from your partner by pressing the "Hint" button.
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