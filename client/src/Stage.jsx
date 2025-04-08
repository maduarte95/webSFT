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
import { VerbalFluencyCollab } from "./stages/VerbalFluencyCollab";
import { VFCollabResult } from "./stages/VFCollabResult";
import { HHCollab } from "./stages/HHCollab";
import { HHCollabResult } from "./stages/HHCollabResult";
import { HHInterleaved } from "./stages/HHInterleaved";
import { HHInterleavedResult } from "./stages/HHInterleavedResult";
import { SwitchesId } from "./stages/SwitchesId";
import { Result } from "./stages/Result";
import { VerbalFluencySolo } from "./stages/VerbalFluencySolo";

export function Stage() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const stage = useStage();

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
        case "LocalAPI":
          return <LocalAPI />;
        default:
          return <Loading />;
      }
    case "HHCollab":
      switch (stage.get("name")) {
        case "HHCollab":
          return <HHCollab />;
        case "SwitchesId":
          return <SwitchesId />;
        case "HHCollabResult":
          return <Result />;
        default:
          return <Loading />;
      }
    case "HHCollabSwitched":
      switch (stage.get("name")) {
        case "HHCollabSwitched":
          return <HHCollab />;
        case "SwitchesId":
          return <SwitchesId />;
        case "HHCollabResult":
          return <Result />;
        default:
          return <Loading />;
      }
    case "Interleaved1":
    case "Interleaved2":
      switch (stage.get("name")) {
        case "HHInterleaved":
          return <HHInterleaved />;
        case "HHInterleavedResult":
          return <Result />;
        case "VerbalFluencyCollab":
          return <VerbalFluencyCollab />;
        case "VFCollabResult":
          return <Result />;
        case "SwitchesId":
          return <SwitchesId />;
        default:
          return <Loading />;
      }
    case "VerbalFluencyTask":
      switch (stage.get("name")) {
        case "VerbalFluencyTask":
          return <VerbalFluencyTask />;
        case "VFResult":
          return <Result />;
        case "SwitchesId":
          return <SwitchesId />;
        default:
          return <Loading />;
      }
    case "VerbalFluencySolo1":
    case "VerbalFluencySolo2":
    case "VerbalFluencySolo3":  
      switch (stage.get("name")) {
        case "VerbalFluencySolo":
          return <VerbalFluencySolo />;
        case "SwitchesId":  // If you want to keep this stage
          return <SwitchesId />;
        case "VFSoloResult": // You might want to create a result component too
          return <Result />;
        default:
          return <Loading />;
      }
    default:
      return <Loading />;
  }
}