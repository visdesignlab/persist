#!/usr/bin/env bash

source ./scripts/test-version-validity.sh

is_valid_semver_label $npm_config_semver

echo ""