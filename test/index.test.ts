import path from "path"
import { test, expect } from "vitest"
import { getPackages } from "../src"

const getFixturePath = (...args: string[]) =>
  path.join(__dirname, "fixtures", ...args)

test("pnpm", async () => {
  const workspace = await getPackages(getFixturePath("pnpm"))

  if (workspace?.type !== "monorepo") {
    expect.fail()
  }

  expect(workspace.root.path).toEqual(getFixturePath("pnpm"))
  expect(workspace.npmClient).toEqual("pnpm")

  for (const pkg of workspace.packages) {
    expect(pkg.path).toEqual(getFixturePath("pnpm/packages", pkg.data.name))
  }
})

test("yarn", async () => {
  const workspace = await getPackages(getFixturePath("yarn"))

  if (workspace?.type !== "monorepo") {
    expect.fail()
  }

  expect(workspace.root.path).toEqual(getFixturePath("yarn"))
  expect(workspace.npmClient).toEqual("yarn")

  for (const pkg of workspace.packages) {
    expect(pkg.path).toEqual(getFixturePath("yarn/packages", pkg.data.name))
  }
})
