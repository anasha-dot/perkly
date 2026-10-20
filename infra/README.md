# Infrastructure

`docker-compose.yml` starts local PostgreSQL from the `postgres:17` image, bound to 127.0.0.1:5432. That major is a proposal. O-03 stays open until the RDS version is checked.

`Dockerfile` builds the API and runs it as the image's `node` user, not root. It is the local and CI run check. It does not deploy to AWS.

No CDK application is defined here. AWS resources wait for account setup (E03) and task P10-01. Do not deploy from this directory.
