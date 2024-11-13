import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";

export function FailedGame({ next }) {
  const player = usePlayer();
  
  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-4">Study Ended</h2>
        <div className="space-y-4 text-center text-gray-600">
          <p className="text-xl">
            Thank you for your interest in participating in our study.
          </p>
          <p className="text-xl">
            Unfortunately, the experiment could not start at this time.
          </p>
        </div>
      </div>
      
      <Alert title="Payment Information">
        <p>
          Please submit the following code to Prolific:{" "}
          <strong>CWVAS57A</strong>
        </p>
        {/* <p className="pt-1">
          You will receive the <strong>base reward</strong> for your time.
        </p> */}
        <p className="pt-1">
          You will be compensated for your time. If you believe you are seeing this message in error, please refresh the page or contact the research team.
        </p>
      </Alert>

      <div className="mt-8 flex justify-center">
        <Button handleClick={next}>Continue</Button>
      </div>
    </div>
  );
}