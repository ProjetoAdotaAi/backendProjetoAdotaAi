const aiConfig = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  // GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent",
  GEMINI_API_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
};
export default aiConfig;