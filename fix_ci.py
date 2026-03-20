with open('.github/workflows/ci.yml', 'r') as f:
    content = f.read()

content = content.replace(
    'run: pnpm run test -- --watch=false',
    'run: pnpm run test'
)

with open('.github/workflows/ci.yml', 'w') as f:
    f.write(content)
