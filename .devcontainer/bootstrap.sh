#!/bin/sh

curl https://pyenv.run | bash

echo '
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
' >> ~/.bashrc

echo '
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
' >> ~/.bash_profile

export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

pyenv install -v 3.8
pyenv which python

echo $(python --version)

. ${NVM_DIR}/nvm.sh
npm install

# pipx install poetry
# poetry install
# . $(poetry env info --path)/bin/activate
pip install --upgrade pip

pip install -r requirements.txt
pipx install cookiecutter

npm run setup

echo ""
echo "Fin."