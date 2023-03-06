#!/bin/sh

. ${NVM_DIR}/nvm.sh
npm install

# pipx install poetry
# poetry install
# . $(poetry env info --path)/bin/activate
pip install -r requirements.txt
pipx install twine
pipx install cookiecutter
pipx install jupyter-releaser

npm run setup

echo "Add auth info to: /home/vscode/pypi/pypirc.\nIgnore if already done."