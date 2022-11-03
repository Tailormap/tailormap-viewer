# Tailormap viewer

The Angular frontend for Tailormap.

## Development requirements

The following are required for successfully building Tailormap viewer:
- NodeJS 16.18 (https://nodejs.org/en/)
- npm 8 (included with NodeJS)
- Docker (https://docs.docker.com/engine/install/) including Buildx and Compose v2 (https://docs.docker.com/compose/install/)

## Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Using a Tailormap backend

When running a dev server, the tailormap-api is proxied on the `/api` path. See [proxy.config.json](proxy.config.js). You can change the URL to connect to a
different tailormap-api instance (you can also run one locally).

## Code scaffolding

Run `npm run ng -- generate component components/[name] --project core|map` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

To create a new service which uses the HttpClient to make API calls run

`npm run ng -- generate service services/[name] --project core|map --http-service`

This creates a service with a HttpClient injected and adjusted spec file to test HTTP calls

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `npm run test` to execute the unit tests via [Jest](https://jestjs.io).

## Building docker images

Use below commands to build and push the cross-platform Docker images to the GitHub container registry.
Please see Docker documentation for more information:
[Building multi-platform images](https://docs.docker.com/build/building/multi-platform/)

```shell
# create a container for x-platform builds (only needed once)
docker buildx create --use --name tailormap-builder --platform linux/arm64,linux/arm/v8
# or activate an existing container
docker buildx use tailormap-builder
# install necessary QEMU platform architectures
docker run --privileged --rm tonistiigi/binfmt --install all
# set version of the docker image and base ref. This will also be the reported version of the application
export VERSION=snapshot
export BASE_HREF=/
# build and push tailormap-config-db (aka "db") and tailormap-viewer (aka "web") images
# for pushing to the GitHub container registry, you need to be logged in with docker login
docker buildx build --pull --build-arg VERSION=${VERSION} \
      --platform linux/amd64,linux/arm64 \
      -t ghcr.io/b3partners/tailormap-config-db:${VERSION} ./docker/db \
      --push
docker buildx build --pull --build-arg VERSION=${VERSION} --build-arg BASE_HREF=${BASE_HREF} \
      --platform linux/amd64,linux/arm64 \
      -t ghcr.io/b3partners/tailormap-viewer:${VERSION} . \
      --push
```
### reference documentation

- [docker buildx build](https://docs.docker.com/engine/reference/commandline/buildx_build/)
- [docker buildx create](https://docs.docker.com/engine/reference/commandline/buildx_create/)


## Running with Docker Compose

Use Docker Compose to run images. It is best to use the Docker Compose (v2) plugin using the `docker compose` command, but
Python version (`docker-compose` command) may also work.

### Running a full Tailormap stack

A full stack also runs configuration database, backend api and administration interface containers. The Angular frontend in this repository
is built and put in a Nginx webserver container to serve as the main entry point. It reverse proxies the `/api/` and `/admin/` paths. Run the stack using:

`docker compose --profile http --profile full up -d`

Go to http://localhost/ for the viewer and http://localhost/admin/ for administration. During the first startup you might see some
exceptions connecting to the database while this is being initialized -- these are harmless as it will be retried later, although you may need
to restart the admin container using `docker compose --profile http --profile restart admin`.

The build configuration for the `db` container for the configuration database (with preloaded data) is also in this
repository. The `api` and `admin` containers are the snapshot-tagged versions by default, which get updated in
the registry automatically. If you want to update your running containers, execute:

- `docker compose --profile http --profile full pull` to pull new images

Run `docker compose --profile http --profile full up -d` again to use the updated images.

#### Running a specific version and other variables

To run a specific version of the stack set the `RELEASE_VERSION` and `VERSION_TAG` environment variables to the desired (and identical)
version, and run:

For a specific version:
```
export VERSION_TAG=10.0.0-rc1
export RELEASE_VERSION=${VERSION_TAG}
docker pull ghcr.io/b3partners/tailormap-config-db:${VERSION_TAG}
docker pull ghcr.io/b3partners/tailormap-viewer:${VERSION_TAG}
docker compose --profile http --profile full up -d
```

For the latest version do the same but use `VERSION_TAG=latest`. The `latest` tag will point to the latest release. To update
a running stack after a new version is release, run `docker compose` with the `pull` and `up` commands.

Environment variables can also be set in a file named `.env` or in a file specified when running Docker Compose with the `--env-file`
command line option. More environment variables are available - copy `.env.template` to `.env` and they will be picked up by Docker Compose.
Some notable variables:

 - `CONFIG_DB_INIT_EMPTY`: Do not initialize the Tailormap configuration database with some preconfigured services and applications.
 - `HOST`: Hostname when running proxied `web-proxied`.

Some other variables are available (such as enabling Sentry), see the Docker Compose configuration for details.

#### Default account

When starting up for the first time, the `api` container creates a user account for user administration on startup with a randomly generated
password. This password is printed to the logs of the `api` container. You can see the password with:

`docker compose --profile http --profile full logs api`

Look for the output containing:

```
api_1          | INFO 1 --- [           main] n.b.t.a.s.StartupAdminAccountBean        :
api_1          | ***
api_1          | *** Use this account for administrating users:
api_1          | ***
api_1          | *** Username: admin
api_1          | *** Password: 6814a911-455b-4d4c-af31-387f89015a2e
api_1          | ***
```

Log in to the administration interface with this account to setup security. The default admin account can only change security settings, add
it to the `Admin` group for full control (you need to login again for changes to take effect). Change the password or save the generated
password somewhere.

#### Resetting account password

If you ever forget the admin password but do not want to re-initialize the database, reset the password with:

```
docker compose --profile http --profile full exec --user postgres db \
  psql tailormap -c "update user_ set password = '{noop}changeme' where username = 'admin'"
```

Remember to change this password using the administration interface. It will be hashed securely using bcrypt.

**Stopping**

`docker compose down`

You can use `docker compose down --rmi all -v` to remove all built and pulled images and remove the volume with the configuration
database. Use `--rmi local` to only remove locally built images.

#### Refreshing the configuration database

The `db` container is just a basic PostgreSQL container but with some initialization scripts to preload some Tailormap configuration. The
database is saved on a volume. The initialization only runs when this volume does not already contain an initialized database. Stop the `db`
container (or the entire stack), remove the volume with `docker volume rm tailormap-viewer_config-db` (or use `docker compose down -v`) and
bring it up again to re-initialize the database.

#### Backing up the configuration database

The configuration database needs to be backed up if you don't want to lose your configuration. The backup procedure isn't any different when
using containers from using PostgreSQL without them: use `pg_dump` and do not backup just the files in `/var/lib/postgresql/`, tempting as
that may be.

Creating a backup:

```
docker compose --profile full exec --user postgres db pg_dump tailormap > tailormap.sql
```

#### Restoring a backup

The restore procedure: drop the database, recreate it and load the backup. You may need to stop the 'api' or 'admin' containers to close any
connections.

```
docker compose  --profile full exec --user postgres db dropdb tailormap
docker compose  --profile full exec --user postgres db createdb --owner=tailormap tailormap
cat tailormap.sql | docker compose --profile full exec -T --user postgres db psql tailormap
```

#### Upgrading to a new major PostgreSQL version

The Docker image for the configuration database is kept up to date with the latest PostgreSQL releases and can move to a new major version
with a new Tailormap release. In this case the database must be dumped and restored (see above). Take note of the major PostgreSQL version
in the release notes whether this is required. You will see an error opening Tailormap and see errors about the PostgreSQL version in the
logs of the 'db' container if you don't do this upgrade. If you did not have a recent backup ready, downgrade the image used by the 'db'
container to the previous major version and backup the database as normal and restore on the newer major version.

### Running only the Angular frontend

Environment variables can be used to reconfigure the `/api/` and `/admin/` Nginx reverse proxies. You can set the URL, HTTP host header (for
when your proxy target is behind name-based virtual hosting and for correct absolute URL generation) or disable them.

This can be used to run only the web container and reverse proxy `/api/` to an instance deployed elsewhere:

```
API_PROXY_URL=https://snapshot.tailormap.nl/api/ \
  API_PROXY_HOST=snapshot.tailormap.nl \
  ADMIN_PROXY_ENABLED=false \
  docker compose --profile http up
```

These environment variables can be configured in a `.env` file as mentioned above under the 'Running a specific version and other variables'
section.

### Using Traefik

The `http` profile starts the `web` container exposing port 80. You can use the `proxied` profile to run a webserver container which does
not expose port 80. It has labels to configure Traefik automatically. Run this profile with Traefik in the same network so your stack is
deployed with name-based virtual hosting and with automatic SSL redirection and termination and provisioning of Let's Encrypt SSL
certificates.
