# Testing

Run the smoke checks before pushing changes:

```bash
npm test
```

The test runner calls the main CLI commands and checks for expected output. It
does not write permanent report files.

Add new smoke checks when adding new CLI commands so basic behavior stays easy
to verify.
