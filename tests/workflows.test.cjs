const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
// Execute the actual TypeScript route handlers with deterministic service doubles.
// These tests exercise authorization and persisted results, not real cloud credentials.
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
let user, db, auth, passwordVerified;
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === "server-only") return {};
  if (id === "@/lib/firebase-admin")
    return { getAdminDb: () => db, getAdminAuth: () => auth };
  if (id === "@/lib/auth/session") return { getSessionUser: async () => user };
  if (id === "firebase-admin/firestore")
    return {
      ...originalLoad.call(this, id, parent, main),
      FieldValue: {
        serverTimestamp: () => ({ sentinel: "time" }),
        increment: (n) => ({ sentinel: "increment", n }),
      },
    };
  if (id.startsWith("@/")) id = path.join(root, id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
function merge(a, b) {
  const result = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v?.sentinel === "increment") result[k] = (result[k] ?? 0) + v.n;
    else if (v?.sentinel === "time")
      result[k] = { toDate: () => new Date(), toMillis: () => Date.now() };
    else if (v && typeof v === "object" && !Array.isArray(v))
      result[k] = merge(result[k] ?? {}, v);
    else result[k] = v;
  }
  return result;
}
class Store {
  constructor(entries) {
    this.data = new Map(Object.entries(entries));
    this.serial = 0;
  }
  doc(p) {
    const store = this;
    return {
      path: p,
      id: p.split("/").at(-1),
      get: async () => store.snapshot(p),
      collection: (name) => store.collection(`${p}/${name}`),
    };
  }
  snapshot(p) {
    const data = this.data.get(p);
    return {
      id: p.split("/").at(-1),
      exists: !!data,
      data: () => data,
      get: (k) => data?.[k],
    };
  }
  collection(p) {
    const store = this;
    const filters = [];
    let max = Infinity;
    return {
      doc: (id) => store.doc(`${p}/${id ?? `generated-${++store.serial}`}`),
      where(k, op, v) {
        filters.push([k, v]);
        return this;
      },
      orderBy() {
        return this;
      },
      limit(n) {
        max = n;
        return this;
      },
      async get() {
        const docs = [...store.data.keys()]
          .filter(
            (k) =>
              k.startsWith(p + "/") &&
              k.split("/").length === p.split("/").length + 1,
          )
          .map((k) => store.snapshot(k))
          .filter((d) => filters.every(([k, v]) => d.get(k) === v))
          .slice(0, max);
        return { docs };
      },
      count() {
        return {
          get: async () => ({
            data: () => ({
              count: [...store.data.keys()].filter(
                (k) =>
                  k.startsWith(p + "/") &&
                  k.split("/").length === p.split("/").length + 1,
              ).length,
            }),
          }),
        };
      },
    };
  }
  batch() {
    const ops = [];
    const store = this;
    return {
      get: (ref) => ref.get(),
      set: (ref, data, opt) => ops.push([ref, data, opt]),
      create: (ref, data) => ops.push([ref, data, { create: true }]),
      update: (ref, data) => ops.push([ref, data, { merge: true }]),
      async commit() {
        for (const [ref, , opt] of ops)
          if (opt?.create && store.data.has(ref.path))
            throw new Error("Already exists");
        for (const [ref, data, opt] of ops)
          store.data.set(
            ref.path,
            merge(opt?.merge ? (store.data.get(ref.path) ?? {}) : {}, data),
          );
      },
    };
  }
  async runTransaction(fn) {
    const tx = this.batch();
    const response = await fn(tx);
    await tx.commit();
    return response;
  }
}
const project = {
  studentId: "lead",
  memberIds: ["lead", "partner"],
  supervisorId: "sup",
  department: "Computer Science",
  title: "Project title",
  topicStatus: "approved",
  chapterStatuses: Array(5).fill("not_started"),
  milestoneStatus: "on_track",
  finalApproved: false,
  progressPct: 0,
  ticketsLast30Days: 0,
  status: "active",
};
const student = (uid = "lead") => ({
  uid,
  role: "student",
  department: "Computer Science",
  name: uid,
});
const supervisor = () => ({
  uid: "sup",
  role: "supervisor",
  department: "Computer Science",
  name: "Lecturer",
});
const req = (body) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const params = { params: { projectId: "p", submissionId: "s" } };
const routes = {
  projects: require("../app/api/projects/route.ts"),
  patch: require("../app/api/projects/[projectId]/route.ts"),
  submit: require("../app/api/projects/[projectId]/submissions/route.ts"),
  review: require("../app/api/projects/[projectId]/submissions/[submissionId]/route.ts"),
  supervisors: require("../app/api/supervisors/route.ts"),
  activity: require("../app/api/projects/[projectId]/activity/route.ts"),
  login: require("../app/api/auth/student-login/route.ts"),
  matric: require("../app/api/auth/matric/route.ts"),
};
const upload = {
  title: "Chapter draft",
  kind: "chapter",
  chapterNumber: 1,
  storagePath: "projects/p/submissions/s/file.pdf",
  fileName: "file.pdf",
  fileSize: 1024,
};
beforeEach(() => {
  user = student();
  db = new Store({
    "projects/p": { ...project, chapterStatuses: [...project.chapterStatuses] },
    "users/lead": {
      role: "student",
      department: "Computer Science",
      displayName: "Lead",
      matricNumber: "F/HD/24/3211001",
      email: "lead@example.test",
    },
    "users/partner": {
      role: "student",
      department: "Computer Science",
      displayName: "Partner",
      matricNumber: "D/ND/24/3211002",
    },
    "users/sup": {
      role: "supervisor",
      department: "Computer Science",
      displayName: "Lecturer",
    },
    "matric_index/D_ND_24_3211002": { uid: "partner" },
    "matric_index/F_HD_24_3211001": { uid: "lead" },
  });
  passwordVerified = false;
  auth = {
    verifyIdToken: async () => {
      assert.ok(passwordVerified);
      return { uid: "lead", role: "student", department: "Computer Science" };
    },
    createCustomToken: async (uid) => `custom-${uid}`,
  };
});
test("matric formats cover all programmes and diplomas", () => {
  const { isMatricNumber, normalizeMatricNumber } = require("../lib/matric.ts");
  for (const program of ["F", "D", "P"])
    for (const diploma of ["ND", "HD"])
      assert.ok(isMatricNumber(`${program}/${diploma}/24/3211001`));
  assert.equal(
    normalizeMatricNumber(" p / hd / 24 / 3211001 "),
    "P/HD/24/3211001",
  );
  for (const bad of [
    "X/HD/24/3211001",
    "F/BSC/24/3211001",
    "F/HD/2024/3211001",
    "F/HD/24/123",
  ])
    assert.equal(isMatricNumber(bad), false);
});
test("supervisor directory contains only the signed-in department", async () => {
  db.data.set("users/other", {
    role: "supervisor",
    department: "Other",
    displayName: "Other",
  });
  const res = await routes.supervisors.GET();
  assert.deepEqual((await res.json()).supervisors, [
    { id: "sup", displayName: "Lecturer" },
  ]);
});
test("student creates topic and team, with notifications and dashboard stats", async () => {
  const res = await routes.projects.POST(
    req({
      supervisorId: "sup",
      title: "A new project topic",
      partnerMatricNumbers: ["D/ND/24/3211002"],
    }),
  );
  assert.equal(res.status, 200);
  const id = (await res.json()).projectId;
  assert.equal(db.data.get(`projects/${id}`).topicStatus, "pending");
  assert.deepEqual(db.data.get(`projects/${id}`).memberIds, [
    "lead",
    "partner",
  ]);
  assert.equal(db.data.get("users/partner").projectId, id);
  assert.ok(
    [...db.data.keys()].some((k) =>
      k.startsWith("users/partner/notifications/"),
    ),
  );
  assert.equal(
    db.data.get("dashboard_stats/sup").byMilestoneStatus.on_track,
    1,
  );
});
test("cross-department supervisor and assigned partner are rejected", async () => {
  db.data.get("users/sup").department = "Other";
  assert.equal(
    (
      await routes.projects.POST(
        req({ supervisorId: "sup", title: "A new project topic" }),
      )
    ).status,
    409,
  );
  db.data.get("users/sup").department = "Computer Science";
  db.data.get("users/partner").projectId = "existing";
  assert.equal(
    (
      await routes.projects.POST(
        req({
          supervisorId: "sup",
          title: "A new project topic",
          partnerMatricNumbers: ["D/ND/24/3211002"],
        }),
      )
    ).status,
    409,
  );
});
test("partners have upload and download access; unrelated student does not", async () => {
  const access = require("../lib/server/project-access.ts");
  assert.ok(await access.canUploadSubmission(student("partner"), "p"));
  assert.ok(await access.canReadProject(student("partner"), "p"));
  assert.equal(await access.canReadProject(student("outsider"), "p"), false);
});
for (const status of ["pending", "approved", "declined"])
  test(`supervisor can set topic ${status} and notify team`, async () => {
    user = supervisor();
    assert.equal(
      (await routes.patch.PATCH(req({ topicStatus: status }), params)).status,
      200,
    );
    assert.equal(db.data.get("projects/p").topicStatus, status);
    assert.ok(
      [...db.data.keys()].some((k) =>
        k.startsWith("users/partner/notifications/"),
      ),
    );
  });
test("students cannot decide topic or fabricate progress", async () => {
  assert.equal(
    (await routes.patch.PATCH(req({ topicStatus: "approved" }), params)).status,
    403,
  );
  assert.equal(
    (await routes.patch.PATCH(req({ progressPct: 100 }), params)).status,
    400,
  );
  assert.equal(db.data.get("projects/p").progressPct, 0);
});
test("only lead can revise declined topic", async () => {
  db.data.get("projects/p").topicStatus = "declined";
  user = student("partner");
  assert.equal(
    (
      await routes.patch.PATCH(
        req({ topicRevision: "Revised valid topic" }),
        params,
      )
    ).status,
    400,
  );
  user = student();
  assert.equal(
    (
      await routes.patch.PATCH(
        req({ topicRevision: "Revised valid topic" }),
        params,
      )
    ).status,
    200,
  );
  assert.equal(db.data.get("projects/p").topicStatus, "pending");
});
test("partner can submit chapters; pending topic blocks chapter upload", async () => {
  user = student("partner");
  assert.equal((await routes.submit.POST(req(upload), params)).status, 200);
  assert.equal(db.data.get("projects/p").chapterStatuses[0], "in_review");
  db.data.get("projects/p").topicStatus = "pending";
  assert.equal((await routes.submit.POST(req(upload), params)).status, 409);
});
test("legacy project without topic status remains submittable", async () => {
  delete db.data.get("projects/p").topicStatus;
  assert.equal((await routes.submit.POST(req(upload), params)).status, 200);
});
test("empty or partial chapter arrays cannot bypass final submission gate", async () => {
  for (const stages of [[], ["approved"], Array(5).fill("not_started")]) {
    db.data.get("projects/p").chapterStatuses = stages;
    assert.equal(
      (await routes.submit.POST(req({ ...upload, kind: "final" }), params))
        .status,
      409,
    );
  }
});
test("five chapters, feedback, grades and final approval persist correctly", async () => {
  for (let i = 1; i <= 5; i++) {
    user = student("partner");
    const response = await routes.submit.POST(
      req({ ...upload, chapterNumber: i }),
      params,
    );
    assert.equal(response.status, 200);
    const submissionId = (await response.json()).submissionId;
    user = supervisor();
    assert.equal(
      (
        await routes.review.PATCH(
          req({ status: "approved", grade: 80, feedback: "Clear structure" }),
          { params: { projectId: "p", submissionId } },
        )
      ).status,
      200,
    );
    assert.equal(
      db.data.get(`projects/p/submissions/${submissionId}`).grade,
      80,
    );
    assert.equal(db.data.get("projects/p").progressPct, i * 20);
  }
  user = student();
  const final = await routes.submit.POST(
    req({ ...upload, kind: "final" }),
    params,
  );
  assert.equal(final.status, 200);
  user = supervisor();
  assert.equal(
    (
      await routes.review.PATCH(req({ status: "approved" }), {
        params: {
          projectId: "p",
          submissionId: (await final.json()).submissionId,
        },
      })
    ).status,
    200,
  );
  assert.equal(db.data.get("projects/p").finalApproved, true);
});
test("rejected final review leaves no partial writes", async () => {
  db.data.set("projects/p/submissions/s", {
    kind: "final",
    status: "pending_review",
    title: "Final",
  });
  user = supervisor();
  assert.equal(
    (await routes.review.PATCH(req({ status: "approved" }), params)).status,
    409,
  );
  assert.equal(
    db.data.get("projects/p/submissions/s").status,
    "pending_review",
  );
});
test("old chapter review cannot overwrite newer submission stage", async () => {
  db.data.set("projects/p/submissions/s", {
    kind: "chapter",
    chapterNumber: 1,
    status: "pending_review",
    title: "Old",
  });
  db.data.get("projects/p").latestChapterSubmissionIds = { 1: "newer" };
  user = supervisor();
  assert.equal(
    (await routes.review.PATCH(req({ status: "approved" }), params)).status,
    409,
  );
});
test("invalid grades and feedback are rejected", async () => {
  user = supervisor();
  for (const review of [{ grade: 101 }, { grade: -1 }, { feedback: 55 }])
    assert.equal(
      (
        await routes.review.PATCH(
          req({ status: "approved", ...review }),
          params,
        )
      ).status,
      400,
    );
});
for (const status of ["approved", "declined"])
  test(`extension can be requested and ${status}`, async () => {
    const requested = new Date(Date.now() + 10 * 86400000)
      .toISOString()
      .slice(0, 10);
    assert.equal(
      (
        await routes.patch.PATCH(
          req({ extensionRequestedUntil: requested }),
          params,
        )
      ).status,
      200,
    );
    user = supervisor();
    assert.equal(
      (
        await routes.patch.PATCH(
          req({
            extensionStatus: status,
            extensionDecisionNote: "Decision note",
          }),
          params,
        )
      ).status,
      200,
    );
    assert.equal(db.data.get("projects/p").extensionStatus, status);
    assert.equal(
      db.data.get("projects/p").nextDeadline,
      status === "approved" ? requested : undefined,
    );
  });
test("invalid dates and student extension decisions are denied", async () => {
  for (const date of ["2026-02-31", "2000-01-01", "bad"])
    assert.equal(
      (await routes.patch.PATCH(req({ extensionRequestedUntil: date }), params))
        .status,
      400,
    );
  assert.equal(
    (await routes.patch.PATCH(req({ extensionStatus: "approved" }), params))
      .status,
    400,
  );
});
test("activity is readable by partner and denied to outsiders", async () => {
  user = student("partner");
  assert.equal((await routes.activity.GET(null, params)).status, 200);
  user = student("outsider");
  assert.equal((await routes.activity.GET(null, params)).status, 403);
});
test("matric login verifies Firebase password before minting custom token", async () => {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-only-public-key";
  const previous = global.fetch;
  global.fetch = async (url, options) => {
    assert.ok(url.startsWith("https://identitytoolkit.googleapis.com/"));
    assert.equal(JSON.parse(options.body).password, "correct-password");
    passwordVerified = true;
    return Response.json({ idToken: "verified-token" });
  };
  try {
    const res = await routes.login.POST(
      req({ matricNumber: "f/hd/24/3211001", password: "correct-password" }),
    );
    assert.equal(res.status, 200);
    assert.equal((await res.json()).customToken, "custom-lead");
  } finally {
    global.fetch = previous;
  }
});
test("wrong password or staff matric profile cannot produce token", async () => {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-only-public-key";
  const previous = global.fetch;
  global.fetch = async () => Response.json({}, { status: 400 });
  try {
    assert.equal(
      (
        await routes.login.POST(
          req({ matricNumber: "F/HD/24/3211001", password: "wrong" }),
        )
      ).status,
      401,
    );
    db.data.get("users/lead").role = "supervisor";
    assert.equal(
      (
        await routes.login.POST(
          req({ matricNumber: "F/HD/24/3211001", password: "wrong" }),
        )
      ).status,
      401,
    );
  } finally {
    global.fetch = previous;
  }
});
test("existing student adds matric; duplicate identifiers are denied", async () => {
  delete db.data.get("users/lead").matricNumber;
  assert.equal(
    (await routes.matric.POST(req({ matricNumber: "P/ND/25/3211999" }))).status,
    200,
  );
  assert.equal(db.data.get("matric_index/P_ND_25_3211999").uid, "lead");
  user = student("partner");
  delete db.data.get("users/partner").matricNumber;
  assert.equal(
    (await routes.matric.POST(req({ matricNumber: "P/ND/25/3211999" }))).status,
    409,
  );
});

test("YABATECH logo remains public without a session", () => {
  const { NextRequest } = require("next/server");
  const { middleware } = require("../middleware.ts");
  const response = middleware(new NextRequest("https://project-supervision-system.vercel.app/yabatech-logo.png"));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("location"), null);
});
