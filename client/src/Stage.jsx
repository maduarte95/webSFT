import {
  usePlayer,
  useRound,
  useStage,
  usePlayers
} from "@empirica/core/player/classic/react";
import { Loading } from "@empirica/core/player/react";
import React from "react";
import { VerbalFluencyTask } from "./stages/VerbalFluencyTask";
import { VFResult } from "./stages/VFResult";
import { LocalAPI } from "./stages/LocalAPI"; 
import { VerbalFluencyCollab } from "./stages/VerbalFluencyCollab.jsx";
import { VFCollabResult } from "./stages/VFCollabResult.jsx";
import { HHCollab } from "./stages/HHCollab.jsx";
import { HHCollabResult } from "./stages/HHCollabResult.jsx";
import { HHInterleaved } from "./stages/HHInterleaved.jsx";
import { HHInterleavedResult } from "./stages/HHInterleavedResult.jsx";

export function Stage() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const stage = useStage();

  // if (player.stage.get("submit")) {
  //   return <Loading />;
  // }

  if (player.stage.get("submit")) {
    if (players.length === 1) {
      return <Loading />;
    }

    return (
      <div className="text-center text-gray-400 pointer-events-none">
        Please wait for other player(s).
      </div>
    );
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
    case "HHCollab":
      switch (stage.get("name")) {
        case "HHCollab":
          return <HHCollab />;
        case "HHCollabResult":
          return <HHCollabResult />;
        case "HHCollabSwitched":
          return <HHCollab />;
        case "HHCollabResultSwitched":
          return <HHCollabResult />;
        default:
          return <Loading />;
      }
    case "HHInterleaved":
      switch (stage.get("name")) {
        case "HHInterleaved":
          return <HHInterleaved />;
        case "HHInterleavedResult":
          return <HHInterleavedResult />;
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
