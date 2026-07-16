# Features

User-visible capabilities live here.

Each feature owns its domain rules, application services, adapters, UI, and tests.
Apps should import feature capabilities through the feature `index.ts`.

Recommended shape:

```text
features/<featureName>/
  domain/
  application/
  adapters/
  ui/
  tests/
  index.ts
```

Cross-feature access should go through public feature entrypoints.
