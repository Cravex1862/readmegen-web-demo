const express = require("express");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const TMP_DIR = path.join(__dirname, "tmp");

app.use(express.json());
app.use(express.static("public"));

app.head("/api/ping", (req, res) => res.sendStatus(200));

function sanitizeRepoUrl(url) {
  url = url.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
  const parsed = new URL(url);
  const parts = parsed.pathname.replace(/\.git$/, "").split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("Invalid repo URL");
  return `https://github.com/${parts[0]}/${parts[1]}.git`;
}

app.post("/api/generate", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  let repoUrl, cloneDir, outputFile;
  try {
    repoUrl = sanitizeRepoUrl(url);
  } catch {
    return res.status(400).json({ error: "Invalid repository URL" });
  }

  const id = crypto.randomBytes(8).toString("hex");
  cloneDir = path.join(TMP_DIR, id);
  outputFile = path.join(TMP_DIR, `output-${id}.md`);
  fs.mkdirSync(TMP_DIR, { recursive: true });

  try {
    execSync(`git clone --depth 1 "${repoUrl}" "${cloneDir}"`, { stdio: "pipe", timeout: 60000 });
  } catch {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    return res.status(400).json({ error: "Failed to clone repository." });
  }

  const readmegenCli = path.join(__dirname, "..", "readmegen", "dist", "index.js");
  if (!fs.existsSync(readmegenCli)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    return res.status(500).json({ error: "readmegen not built. Run 'npm run build' in readmegen project." });
  }

  try {
    execSync(
      `node "${readmegenCli}" --no-ai --output "${outputFile}" --overwrite "${cloneDir}"`,
      { encoding: "utf-8", timeout: 30000, windowsHide: true },
    );
  } catch {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    return res.status(500).json({ error: "Failed to generate README." });
  }

  const content = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf-8") : "";
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  res.json({ content });
});

app.listen(PORT, () => {
  console.log(`readmegen web demo running at http://localhost:${PORT}`);
});
