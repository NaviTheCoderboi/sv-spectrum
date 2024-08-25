# Contributing

Sv-aria is a monorepo using turborepo and pnpm workspaces.
we use changesets to manage versioning and releases.

## Clone or Fork the Project

```sh
git clone https://github.com/NaviTheCoderboi/sv-aria
```

## Install Dependencies

If you run this at the root of your project it's going to install the dependecies for every package.

```sh
pnpm i
```

## Sv-aria

-   `packages` directory contains all the packages. For example: interactions, etc.
-   `apps` directory contains all the apps. For example: docs, etc. docs uses astro (starlight) for the documentation.

-   As we uses changesets to manage versioning and releases, you can run `pnpm changeset` to create a new changeset.
