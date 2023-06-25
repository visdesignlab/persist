#!/bin/bash

banner() {
    echo "========================================"
}

# Setup node environment
banner
echo "Setting up node 18"
nvm install 18
nvm use 18
echo "Node setup complete"
banner

echo ""

# Setup python environment
banner
echo "Setting up python 3.8 venv"
pyenv virtualenv 3.8 persist-ext-venv
pyenv local persist-ext-venv
pip install --upgrade pip

echo ""
echo "Installing python dependencies"
pip install -r requirements.txt
echo "Python setup complete"
banner

echo ""

banner
echo "Setting up extension development"
jlpm run setup
echo "Setup finished, run: "jlpm run dev" to start extension development"
banner
