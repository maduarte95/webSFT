import { EmpiricaClassic } from "@empirica/core/player/classic";
import { EmpiricaContext } from "@empirica/core/player/classic/react";
import { EmpiricaMenu, EmpiricaParticipant } from "@empirica/core/player/react";
import React from "react";
import { Game } from "./Game";
import { ExitSurvey } from "./intro-exit/ExitSurvey";
import { Introduction } from "./intro-exit/Introduction";
import { MyConsent } from "./intro-exit/Consent";
import { PreTask } from "./intro-exit/PreTask";
import { PostQuestions } from "./intro-exit/PostQuestions";
import { PostSurvey } from "./intro-exit/PostSurvey";
import { TypingSpeedTest } from "./intro-exit/TypingSpeedTest";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerKey = urlParams.get("participantKey") || "";

  const { protocol, host } = window.location;
  const url = `${protocol}//${host}/query`;

  function introSteps({ game, player }) {
    return [MyConsent, TypingSpeedTest, PreTask, Introduction,];
  }

  function exitSteps({ game, player }) {
    return [PostSurvey, PostQuestions, ExitSurvey];
  }

  function consent() {
    return {
      component: MyConsent,
      onConsent: () => {
        console.log("Consent given");
        // You can add any other logic here that you want to happen when consent is given
      }
    };
  }
  
  //add redirect to prolific if consent is not given


  return (
    <EmpiricaParticipant url={url} ns={playerKey} modeFunc={EmpiricaClassic}>
      <div className="h-screen relative">
        <EmpiricaMenu position="bottom-left" />
        <div className="h-full overflow-auto">
          <EmpiricaContext 
            consent={consent} 
            introSteps={introSteps} 
            exitSteps={exitSteps}
          >
            <Game />
          </EmpiricaContext>
        </div>
      </div>
    </EmpiricaParticipant>
  );
}
