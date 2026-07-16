# Apps

Runtime entrypoints live here.

Apps connect the extension runtime to feature modules. They may detect page or route
context, find mount points, and call feature entrypoints.

Keep business rules, site parsers, storage models, and reusable UI logic in
`src/features`, `src/platform`, or `src/shared`.
