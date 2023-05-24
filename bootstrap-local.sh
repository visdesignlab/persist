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
pyenv install -s 3.8 interactivede-venv
pyenv virtualenv 3.8 interactivede-venv
pyenv local interactivede-venv
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
