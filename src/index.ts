import path from "path"
import fs from "fs"
import yaml from "js-yaml"
import JoyCon from "joycon"
import glob from "fast-glob"

export type NpmClient = "npm" | "yarn" | "pnpm"

export type Package = {
  data: Record<string, any>
  path: string
}

export type NonMonorepo = {
  type: "non-monorepo"
  npmClient: NpmClient
  package: Package
}

export type Monorepo = {
  type: "monorepo"
  npmClient: NpmClient
  root: Package
  packages: Package[]
}

const readJsonFile = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"))

const getNpmClient = (rootDir: string): NpmClient | null => {
  const pairs: { type: NpmClient; file: string }[] = [
    { type: "npm", file: "package-lock.json" },
    { type: "yarn", file: "yarn.lock" },
    { type: "pnpm", file: "pnpm-lock.yaml" },
  ]
  for (const pair of pairs) {
    const file = path.join(rootDir, pair.file)
    if (fs.existsSync(file)) {
      return pair.type
    }
  }
  return null
}

export const getPackages = async (
  cwd: string,
): Promise<NonMonorepo | Monorepo | null> => {
  const configLoader = new JoyCon({
    packageKey: "workspaces",
    cwd,
  })
  const rootLoader = new JoyCon({
    cwd,
  })

  configLoader.addLoader({
    test: /\.yaml$/,
    loadSync(filepath) {
      const contents = fs.readFileSync(filepath, "utf8")
      return yaml.load(contents)
    },
  })

  const configFile = configLoader.loadSync([
    "package.json",
    "pnpm-workspace.yaml",
  ])

  if (!configFile.path) {
    const rootPkgFile = rootLoader.loadSync(["package.json"])
    if (!rootPkgFile.path) {
      return null
    }
    return {
      type: "non-monorepo",
      npmClient: getNpmClient(rootPkgFile.path) || "npm",
      package: {
        data: rootPkgFile.data,
        path: rootPkgFile.path,
      },
    }
  }

  const isPnpm = configFile.path.endsWith("pnpm-workspace.yaml")

  const workspaces =
    // pnpm or lerna
    isPnpm || configFile.path.endsWith("lerna.json")
      ? configFile.data.packages
      : // npm or yarn
        configFile.data

  const rootDir = path.dirname(configFile.path)

  const dirs = await glob(workspaces, {
    onlyDirectories: true,
    absolute: true,
    cwd: rootDir,
  })

  return {
    type: "monorepo",
    npmClient: isPnpm ? "pnpm" : getNpmClient(rootDir) || "npm",
    root: {
      path: rootDir,
      data: readJsonFile(path.join(rootDir, "package.json")),
    },
    packages: dirs.map((dir) => {
      return {
        path: dir,
        data: readJsonFile(path.join(dir, "package.json")),
      }
    }),
  }
}
