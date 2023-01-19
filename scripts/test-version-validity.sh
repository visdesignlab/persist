is_valid_semver_label() {
  local label="$1"

  if [[ "$label" == "major"  ]] || [[ "$label" == "minor"  ]] || [[ "$label" == "patch"  ]]; then
    echo "Yay: $label"
  else
    echo "Invalid option: $label"
    echo "Valid options are: major, minor, patch"
    echo ""
    exit 1
  fi

}
