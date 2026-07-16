# Platform

Browser extension infrastructure lives here.

Platform modules wrap Chrome APIs, network requests, storage, tasks, and logging.
They expose stable utilities for apps and features.

Platform code may import `src/shared`. It should stay independent from feature
internals.
