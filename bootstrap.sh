#!/bin/bash

banner() {
    echo "========================================"
}

# Setup node environment
banner
echo "Detecting Nodejs. We expect Node 18.x. Other versions may work, but are not tested."
if ! command -v node &> /dev/null
then
    echo "Node could not be found"
    echo "Please install nodejs 18.x"
    exit
fi
banner

echo ""

# Setup python environment
banner
echo "Setting up python env"
pip install --upgrade pip
pip install pipx
pipx install hatch

echo ""

banner
echo "Setting up extension development"
hatch run jlpm install
hatch run jlpm run setup

echo ""

banner
echo "Setup finished, run: "hatch run jlpm dev:lab" and "hatch run jlpm dev:ext" to start extension development"
banner
