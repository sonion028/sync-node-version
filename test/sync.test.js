import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { resolveNodeVersion, syncNodeVersion } from "../src/sync.js";

const rootPath = path.resolve(new URL("..", import.meta.url).pathname);
const cliPath = path.join(rootPath, "src/index.js");

const withTempProject = (packageJson, callback) => {
  const projectPath = fs.mkdtempSync(
    path.join(os.tmpdir(), "sync-node-version-"),
  );
  fs.writeFileSync(
    path.join(projectPath, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
    "utf8",
  );

  try {
    return callback(projectPath);
  } finally {
    if (typeof fs.rmSync === "function") {
      fs.rmSync(projectPath, { recursive: true, force: true });
    } else {
      fs.rmdirSync(projectPath, { recursive: true });
    }
  }
};

const readNodeVersion = (projectPath) =>
  fs.readFileSync(path.join(projectPath, ".node-version"), "utf8");

assert.equal(resolveNodeVersion("20"), "20");
assert.equal(resolveNodeVersion("20.19"), "20.19");
assert.equal(resolveNodeVersion(">=20.19.0"), "20.19.0");
assert.equal(resolveNodeVersion("^20.19.0 || >=22.12.0"), "22.12.0");
assert.equal(resolveNodeVersion("20 || 20.1"), "20.1");
assert.equal(resolveNodeVersion("20.1 || 20.1.1"), "20.1.1");
assert.equal(resolveNodeVersion("20 || 20.0.0"), "20");

assert.equal(
  resolveNodeVersion(" ^20.19.0   ||   >=22.12.0 ", {
    versionRange: true,
  }),
  "^20.19.0 || >=22.12.0",
);
assert.equal(resolveNodeVersion("=20.19", { versionRange: true }), "=20.19");

for (const invalidVersion of [
  "",
  "20.x",
  "20.19.0.1",
  ">20.19.0",
  "<=20.19.0",
  "^20.19.0 ||",
  "|| >=22.12.0",
  "v20.19.0",
  "01.2.3",
]) {
  assert.throws(
    () => resolveNodeVersion(invalidVersion),
    /Invalid node version/,
    `${invalidVersion} should be invalid`,
  );
}

withTempProject(
  {
    engines: {
      node: ">=18.18.0",
    },
    devEngines: {
      runtime: {
        version: "^20.19.0 || >=22.12.0",
      },
    },
  },
  (projectPath) => {
    syncNodeVersion(projectPath);
    assert.equal(readNodeVersion(projectPath), "22.12.0");

    syncNodeVersion(projectPath, { versionRange: true });
    assert.equal(readNodeVersion(projectPath), "^20.19.0 || >=22.12.0");
  },
);

withTempProject(
  {
    engines: {
      node: ">=18.18.0",
    },
  },
  (projectPath) => {
    syncNodeVersion(projectPath);
    assert.equal(readNodeVersion(projectPath), "18.18.0");
  },
);

withTempProject(
  {
    engines: {
      node: ">20.19.0",
    },
  },
  (projectPath) => {
    assert.throws(() => syncNodeVersion(projectPath), /Invalid node version/);
    assert.equal(fs.existsSync(path.join(projectPath, ".node-version")), false);
  },
);

withTempProject(
  {
    engines: {
      node: "^20.19.0 || >=22.12.0",
    },
  },
  (projectPath) => {
    execFileSync(process.execPath, [cliPath], {
      cwd: projectPath,
      encoding: "utf8",
    });
    assert.equal(readNodeVersion(projectPath), "22.12.0");

    execFileSync(process.execPath, [cliPath, "--version-range=true"], {
      cwd: projectPath,
      encoding: "utf8",
    });
    assert.equal(readNodeVersion(projectPath), "^20.19.0 || >=22.12.0");

    execFileSync(process.execPath, [cliPath, "--version-range"], {
      cwd: projectPath,
      encoding: "utf8",
    });
    assert.equal(readNodeVersion(projectPath), "^20.19.0 || >=22.12.0");

    execFileSync(process.execPath, [cliPath, "--version-range=false"], {
      cwd: projectPath,
      encoding: "utf8",
    });
    assert.equal(readNodeVersion(projectPath), "22.12.0");
  },
);

assert.throws(
  () =>
    execFileSync(process.execPath, [cliPath, "--unknown"], {
      cwd: rootPath,
      encoding: "utf8",
      stdio: "pipe",
    }),
  /Command failed/,
);
