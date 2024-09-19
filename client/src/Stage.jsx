import {
  usePlayer,
  useRound,
  useStage,
} from "@empirica/core/player/classic/react";
import { Loading } from "@empirica/core/player/react";
import React from "react";
// import { APIInteraction } from "./stages/APIInteraction";
import { VerbalFluencyTask } from "./stages/VerbalFluencyTask";
import { VFResult } from "./stages/VFResult";
import { LocalAPI } from "./stages/LocalAPI"; // Import the new LocalAPI component
import { VerbalFluencyCollab } from "./stages/VerbalFluencyCollab.jsx";
import { VFCollabResult } from "./stages/VFCollabResult.jsx";

export function Stage() {
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();

  if (player.stage.get("submit")) {
    return <Loading />;
  }

  switch (round.get("name")) {
    case "testRound":
      switch (stage.get("name")) {
        // case "apiInteraction":
        //   return <APIInteraction />;
        case "LocalAPI":
          return <LocalAPI />;
        default:
          return <Loading />;
      }
    case "VFTask":
      switch (stage.get("name")) {
        case "VerbalFluencyTask":
          return <VerbalFluencyTask />;
        case "VFResult":
          return <VFResult />;
        default:
          return <Loading />;
      }
    case "VFTCollab":
      switch (stage.get("name")) {
        case "VerbalFluencyCollab":
          return <VerbalFluencyCollab />;
        case "VFCollabResult":
          return <VFCollabResult />;
        default:
          return <Loading />;
      }
    default:
      return <Loading />;
  }
}
