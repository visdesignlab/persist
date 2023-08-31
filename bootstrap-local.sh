#!/bin/bash

banner() {
    echo "========================================"
}

# Setup python environment
banner
echo "Setting up python 3.8 venv"
pyenv virtualenv 3.8 persist-ext-venv
pyenv local persist-ext-venv

echo ""
echo "Upgrading pip"
pip install --upgrade pip

echo ""
echo "Installing pipx"
pip install pipx

echo ""
echo "Installing hatch"
pipx install hatch
banner
