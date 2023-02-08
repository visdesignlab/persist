LINE=". $(poetry env info --path)/bin/activate"
FILE="$HOME/.bashrc"
grep -qF -- "$LINE" "$FILE" || echo "$LINE" >> "$FILE"