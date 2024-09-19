import React from "react";
import { Button } from "../components/Button";


export function Introduction({ next }) {
  return (
    <div className="mt-3 sm:mt-5 p-20">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Instruction One
      </h3>
      <div className="mt-2 mb-6">
        <p className="text-sm text-gray-500">
        In this game, you will complete tasks and interact with an API.
        <br />
        In <strong>each round of the game</strong>, you will:
        </p>
        <p>
        (a) complete the tasks presented to you
        </p>
        <p>
        (b) see the results of your interactions
        </p>
      </div>
      <Button handleClick={next} autoFocus>
        <p>Next</p>
      </Button>
    </div>
  );
}