#!/bin/sh

. ${NVM_DIR}/nvm.sh
nvm install --lts
npm install

pipx install poetry
pipx install twine
pipx install cookiecutter

poetry install
. $(poetry env info --path)/bin/activate

echo ""
echo "Installing using $(which python)"
echo ""

npm run setup

echo "Add auth info to: /home/vscode/pypi/pypirc.\nIgnore if already done."
# npm run setup