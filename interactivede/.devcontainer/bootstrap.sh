#!/bin/sh

. ${NVM_DIR}/nvm.sh
npm install

pipx install poetry

poetry install
. $(poetry env info --path)/bin/activate
pipx install twine
pipx install cookiecutter

echo ""
echo "Installing using $(which python)"
echo ""

npm run setup

echo "Add auth info to: /home/vscode/pypi/pypirc.\nIgnore if already done."
# npm run setup