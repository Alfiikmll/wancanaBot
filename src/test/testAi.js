import { askGemini } from "../AI/aiChat.js";

const answer = await askGemini(
  "tolong jelasin game ini dong aku masi pemula ",
);

console.log(answer);