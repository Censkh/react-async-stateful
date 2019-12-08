cd examples
if [[ -v CI ]]; then
  npm ci
fi
npm run build