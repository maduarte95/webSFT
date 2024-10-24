import React from "react";
import { Consent } from "@empirica/core/player/react";

export function MyConsent({ next }) {
  const handleConsent = () => {
    console.log("Consent given");
    next();
  };

  const consentText = (
    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
      <p style={{ marginBottom: '1em' }}>Welcome,</p>

      <p style={{ marginBottom: '1em' }}>
        We wish to invite you to participate in a study exploring the mechanisms of creative collaboration with artificial intelligence (AI) systems. Your participation involves performing a computer-based task in which you and a partner will be asked to name items from different categories within a time limit. You may collaborate with a human partner or an AI system.
      </p>

      <p style={{ marginBottom: '1em' }}>
        By participating in this study, you will be contributing to the improvement of human-AI collaboration for creative tasks.
      </p>

      <p style={{ marginBottom: '1em' }}>Important Information:</p>
      <div style={{ marginLeft: '1em', marginBottom: '1em' }}>
        • Your participation is completely voluntary and you may choose to withdraw at any time<br/>
        • No significant risks or discomforts are expected with this experiment<br/>
        • All data will be anonymized and stored safely at our research institution<br/>
        • You can withdraw your data at any time by contacting [contact person] and mentioning your participant code
      </div>

      <p style={{ marginBottom: '1em' }}>By clicking "I Agree" below, you confirm that:</p>
      <div style={{ marginLeft: '1em' }}>
        • I have read and understand the above information<br/>
        • I have had the opportunity to ask questions and have them answered<br/>
        • I understand that all personal data will remain confidential and that all efforts will be made to guarantee that I can't be identified (except if required by law)<br/>
        • I understand that the data obtained from the experiment will be codified and will only be accessible by the researchers involved in the study<br/>
        • I understand that my participation is voluntary and that I am free to withdraw without giving any justifications, and that my data will be removed unless already published, in pooled form, in scientific journals<br/>
        • I agree to take part in this study
      </div>
    </div>
  );

  return (
    <Consent
      title="Informed Consent"
      text={consentText}
      buttonText="I Agree"
      onConsent={handleConsent}
    />
  );
}

