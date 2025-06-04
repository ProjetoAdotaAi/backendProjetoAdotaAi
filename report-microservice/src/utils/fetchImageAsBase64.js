import axios from "axios";

export async function fetchImageAsBase64(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const contentType = response.headers["content-type"];
  const base64 = Buffer.from(response.data, "binary").toString("base64");
  return { base64, mimeType: contentType };
}