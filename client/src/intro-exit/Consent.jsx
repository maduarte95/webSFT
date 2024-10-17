import React from "react";
import { Consent } from "@empirica/core/player/react";

export function MyConsent({ next }) {
  const handleConsent = () => {
    console.log("Consent given");
    next();
  };

  return (
    <Consent
      title="Informed Consent"
      text="By participating in this study, you acknowledge that you have read and agree to the terms outlined in the consent form. This study involves collaborative problem-solving tasks. Your participation is voluntary, and you may withdraw at any time. All data collected will be kept confidential and used solely for research purposes."
      buttonText="I Agree"
      onConsent={handleConsent}
    />
  );
}

