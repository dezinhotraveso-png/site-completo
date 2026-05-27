import { Router } from "express";

const router = Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "dezinhotraveso-png";
const GITHUB_REPO = "site-completo";
const DATA_FILE = "replit-data.json";
const ACCESS_LOG_FILE = "replit-access-log.json";

function githubHeaders() {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
    "User-Agent": "replit-techstore",
  };
}

async function getGithubFile(
  path: string,
): Promise<{ sha: string; content: string } | null> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    { headers: githubHeaders() },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { sha: string; content: string };
  return data;
}

async function putGithubFile(
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<boolean> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: githubHeaders(),
      body: JSON.stringify(body),
    },
  );
  return res.ok;
}

router.get("/github/data", async (req, res) => {
  if (!GITHUB_TOKEN) {
    req.log.warn("GITHUB_TOKEN not configured");
    return res.json({});
  }
  try {
    const file = await getGithubFile(DATA_FILE);
    if (!file) return res.json({});
    const raw = Buffer.from(
      file.content.replace(/\n/g, ""),
      "base64",
    ).toString("utf-8");
    return res.json(JSON.parse(raw));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch github data");
    return res.json({});
  }
});

router.post("/github/data", async (req, res) => {
  if (!GITHUB_TOKEN) return res.json({ ok: false, reason: "no token" });
  try {
    const payload = req.body as Record<string, unknown>;
    const content = JSON.stringify(payload, null, 2);
    const existing = await getGithubFile(DATA_FILE);
    const timestamp = new Date().toISOString();
    const ok = await putGithubFile(
      DATA_FILE,
      content,
      `🔄 Auto-save ${timestamp}`,
      existing?.sha,
    );
    return res.json({ ok });
  } catch (err) {
    req.log.error({ err }, "Failed to save github data");
    return res.status(500).json({ ok: false });
  }
});

router.post("/github/access", async (req, res) => {
  if (!GITHUB_TOKEN) return res.json({ ok: false, reason: "no token" });
  try {
    const entry = {
      ...(req.body as { page?: string; timestamp?: string; referrer?: string }),
      ip: req.ip,
    };

    const existing = await getGithubFile(ACCESS_LOG_FILE);
    let logs: Array<Record<string, unknown>> = [];
    if (existing) {
      const raw = Buffer.from(
        existing.content.replace(/\n/g, ""),
        "base64",
      ).toString("utf-8");
      const parsed = JSON.parse(raw);
      logs = Array.isArray(parsed) ? parsed : parsed.entries || [];
    }

    logs.push(entry);
    if (logs.length > 2000) logs = logs.slice(-2000);

    const ok = await putGithubFile(
      ACCESS_LOG_FILE,
      JSON.stringify(logs, null, 2),
      `📊 Access log ${entry.timestamp ?? new Date().toISOString()}`,
      existing?.sha,
    );
    return res.json({ ok });
  } catch (err) {
    req.log.error({ err }, "Failed to update access log");
    return res.status(500).json({ ok: false });
  }
});

router.get("/github/commits", async (req, res) => {
  if (!GITHUB_TOKEN) return res.json([]);
  try {
    const perPage = Math.min(parseInt((req.query["per_page"] as string) ?? "50"), 100);
    const page = parseInt((req.query["page"] as string) ?? "1");
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=${perPage}&page=${page}`,
      { headers: githubHeaders() },
    );
    if (!ghRes.ok) return res.json([]);
    const raw = (await ghRes.json()) as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      html_url: string;
    }>;
    const commits = raw.map((c) => ({
      sha: c.sha.slice(0, 7),
      fullSha: c.sha,
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));
    return res.json(commits);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch commits");
    return res.json([]);
  }
});

router.get("/github/images", (req, res) => {
  const category = (req.query["category"] as string) ?? "";
  const name = (req.query["name"] as string) ?? "";

  const imageMap: Record<string, string[]> = {
    Teclados: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1561112078-7d24e04c3407?w=700&q=85&auto=format&fit=crop",
    ],
    Mouses: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1563297007-0686b7003af7?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1716280843490-e1fdd6c0fc06?w=700&q=85&auto=format&fit=crop",
    ],
    Monitores: [
      "https://images.unsplash.com/photo-1593640408182-31c228e4db10?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=700&q=85&auto=format&fit=crop",
    ],
    Headsets: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1599669454699-248893623440?w=700&q=85&auto=format&fit=crop",
    ],
    Notebooks: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=700&q=85&auto=format&fit=crop",
    ],
    Smartwatches: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85&auto=format&fit=crop",
    ],
    Periféricos: [
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612199931989-00561cf53c58?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598986646512-9330bcc4c0dc?w=700&q=85&auto=format&fit=crop",
    ],
    Setups: [
      "https://images.unsplash.com/photo-1593640408182-31c228e4db10?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=700&q=85&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526657782461-9fe13402a841?w=700&q=85&auto=format&fit=crop",
    ],
  };

  const fallback = [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=700&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=700&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&q=85&auto=format&fit=crop",
  ];

  const images = imageMap[category] ?? fallback;
  return res.json({ images, category, name });
});

export default router;

