const repoUrl = document.getElementById("repoUrl");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const previewEl = document.getElementById("preview");
const lineCountEl = document.getElementById("lineCount");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const badgeEl = document.getElementById("envBadge");

let lastContent = "";

function setStatus(type, msg) {
  statusEl.className = type;
  statusEl.textContent = msg;
  statusEl.classList.remove("hidden");
}

function hideStatus() {
  statusEl.classList.add("hidden");
}

generateBtn.addEventListener("click", async () => {
  const url = repoUrl.value.trim();
  if (!url) {
    setStatus("error", "Enter a repository URL");
    return;
  }

  hideStatus();
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  resultEl.classList.add("hidden");

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    lastContent = data.content;
    previewEl.textContent = data.content;
    lineCountEl.textContent = `${data.content.split("\n").length} lines`;
    resultEl.classList.remove("hidden");
    badgeEl.className = "badge backend";
    badgeEl.textContent = "Vercel edge";
    setStatus("success", "README generated");
  } catch (err) {
    setStatus("error", err.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate";
  }
});

repoUrl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") generateBtn.click();
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(lastContent);
    const orig = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = orig, 1500);
  } catch {
    copyBtn.textContent = "Failed";
  }
});

downloadBtn.addEventListener("click", () => {
  const blob = new Blob([lastContent], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "README.md";
  a.click();
  URL.revokeObjectURL(a.href);
});
