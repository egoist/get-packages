import path from "path"
import { test, expect } from "vitest"
import { getPackages } from "../src"

const getFixturePath = (...args: string[]) =>
  path.join(__dirname, "fixtures", ...args)

const slash = (p: string) => p.replace(/\\/g, "/")

const expectPathEqual = (a: string, b: string) =>
  expect(slash(a)).toEqual(slash(b))

test("pnpm", async () => {
  const workspace = await getPackages(getFixturePath("pnpm"))

  if (workspace?.type !== "monorepo") {
    expect.fail()
  }

  expectPathEqual(workspace.root.path, getFixturePath("pnpm"))
  expect(workspace.npmClient).toEqual("pnpm")

  for (const pkg of workspace.packages) {
    expectPathEqual(pkg.path, getFixturePath("pnpm/packages", pkg.data.name))
  }
})

test("yarn", async () => {
  const workspace = await getPackages(getFixturePath("yarn"))

  if (workspace?.type !== "monorepo") {
    expect.fail()
  }

  expectPathEqual(workspace.root.path, getFixturePath("yarn"))
  expect(workspace.npmClient).toEqual("yarn")

  for (const pkg of workspace.packages) {
    expectPathEqual(pkg.path, getFixturePath("yarn/packages", pkg.data.name))
  }
})
