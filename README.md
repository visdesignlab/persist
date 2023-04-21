# interactivede

[![Github Actions Status](https://github.com/kirangadhave/notebook-vis-integration//workflows/Build/badge.svg)](https://github.com/kirangadhave/notebook-vis-integration/actions/workflows/build.yml)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/kirangadhave/interactivede/main?urlpath=lab)
A JupyterLab extension.

## Requirements

- JupyterLab >= 3.0

## Install

To install the extension, execute:

```bash
pip install interactivede
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall interactivede
```

## Contributing

### Development install

#### Develop with VSCode Dev Containers

You can develop using VSCode Dev Containers. You need to have [`Docker`](https://docs.docker.com/get-docker/), [`VScode`](https://code.visualstudio.com/), and [`Dev Containers`](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension. You can learn more about developing in containers [here](https://code.visualstudio.com/docs/devcontainers/containers).

Follow instructions on how to load the github repository inside the devcontainer, and vscode will set the project up for you.

#### Local development

> Note: You will need [`nvm`](https://github.com/nvm-sh/nvm), [`pyenv`](https://github.com/pyenv/pyenv), [`pyenv-virtualenv`](https://github.com/pyenv/pyenv-virtualenv) build the extension package.

Once you have the above setup complete, clone this repository and run the following:

```bash
./bootstrap-local.sh
```

Once the setup has executed successfully, you should have `jlpm` available on your `$PATH`. Now run:

```bash
jlpm run setup
```

After the setup is complete, run the following command to start development:

```bash
jlpm run dev
```

<!--
The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the interactivede directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
``` -->

### Development uninstall

```bash
pip uninstall interactivede
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `interactivede` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)
