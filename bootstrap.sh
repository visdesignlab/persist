#!/bin/sh

. ${NVM_DIR}/nvm.sh
nvm install --lts
poetry install

. $(poetry env info --path)/bin/activate

npm install

npm run setup