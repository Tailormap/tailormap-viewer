# Tailormap viewer

The Angular frontend for Tailormap.

## Running using Docker Compose

Install [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) (version 2) and
run:

```shell
docker network create traefik 2>/dev/null
docker compose -f docker-compose.yml -f docker-compose-http.yml up
```

This runs Tailormap on http://localhost:8080/.

Tailormap will run in the foreground (press Control+C to stop) unless you start it with `docker compose up -d`. Stop Tailormap
using `docker compose down` (add `-v` to remove the volume for the database).

By default, the latest development Docker image will be used (tagged with `snapshot`). This is published automatically by a GitHub Action from the `main` branch. To use the latest released versions, copy `.env.template` to `.env` and set the `VERSION` variable to `latest` before running.

To update a running stack after a new version is released, run `docker compose` with the `pull` and `up` commands.

### Default admin account

To log in to the admin interface go to http://localhost:8080/admin/.

When starting up for the first a password will the randonly generated for the admin account. This password is printed to the logs of the `tailormap` container. You can see the password with:

`docker compose logs tailormap`

Look for the output containing:

```
tailormap-viewer-tailormap-1          | INFO 1 --- [           main] n.b.t.a.s.StartupAdminAccountBean        :
tailormap-viewer-tailormap-1          | ***
tailormap-viewer-tailormap-1          | *** Use this account for administrating users:
tailormap-viewer-tailormap-1          | ***
tailormap-viewer-tailormap-1          | *** Username: admin
tailormap-viewer-tailormap-1          | *** Password: 6814a911-455b-4d4c-af31-387f89015a2e
tailormap-viewer-tailormap-1          | ***
```

Log in to the administration interface with this account to set up security. The default admin account can only change security settings, add it to the `Admin` group for full control (you need to log in again for changes to take effect). Change the password or save the generated password somewhere.

#### Resetting an account password

If you ever forget the admin password but do not want to re-initialize the database, reset the password with:

```
docker compose exec --user postgres db \
  psql tailormap -U tailormap -c "update user set password = '{noop}changeme' where username = 'admin'"
```

Remember to change this password using the administration interface. It will be hashed securely using bcrypt.

### Running in production behind a reverse proxy

To run Tailormap in production, you need to put it behind a reverse proxy that handles SSL termination.

Copy `.env.template` to `.env`, set the variables and run `docker compose up -d` and connect your reverse proxy container such as Traefik to
the `tailormap` container on port 8080. You can set the `PROXY_NETWORK` variable in `.env` to specify the external network the reverse proxy
container is in to make tailormap reachable by the proxy.

If you're using a reverse proxy without Docker just use `docker compose -f docker-compose.yml -f docker-compose-http.yml` to have Tailormap
listen only on the loopback interface on port 8080 only reachable by your reverse proxy. You can customize the port using a `.env` file.

#### Refreshing the configuration database

Tailormap creates database tables automatically. To start fresh, bring the stack down removing the database volume with
`docker compose down -v` and restart Tailormap.

#### Backing up the configuration database

The configuration database needs to be backed up if you don't want to lose your configuration. The backup procedure isn't any different when
using containers from using PostgreSQL without them: use `pg_dump` and do not back up just the files in `/var/lib/postgresql/`, tempting as
that may be.

Creating a backup:

```
docker compose exec --user postgres db pg_dump -U tailormap tailormap > tailormap.sql
```

#### Restoring a backup

The restore procedure: drop the database, recreate it and load the backup. You may need to stop the `tailormap` container to close any
connections.

```
docker compose stop tailormap
docker compose exec --user postgres db dropdb -U tailormap tailormap
docker compose exec --user postgres db createdb -U tailormap --owner=tailormap tailormap
cat tailormap.sql | docker compose --profile full exec -T --user postgres db psql tailormap
cat tailormap.sql | docker compose exec -T --user postgres db psql -U tailormap tailormap
docker compose start tailormap
```

#### Upgrading to a new major PostgreSQL version

The Docker image for the configuration database is kept up to date with the latest PostgreSQL releases and can move to a new major version
with a new Tailormap release. In this case the database must be dumped and restored (see above). Take note of the major PostgreSQL version
in the release notes whether this is required. You will see an error opening Tailormap and see errors about the PostgreSQL version in the
logs of the `db` container if you don't do this upgrade. If you did not have a recent backup ready, downgrade the image used by the `db`
container to the previous major version and backup the database as normal and restore on the newer major version.

## Development

After you've made your some changes to the source you can build your own Docker image using `docker compose build`. For development, it's quicker to run a development server without Docker.

The following is required for successfully building Tailormap:

- NodeJS 18.x (https://nodejs.org/en/); the current LTS
- npm 8 (included with NodeJS)

### Dev server

Run `npm run start` for a dev server, or `npm run start-nl` for the Dutch localized version. Navigate to `http://localhost:4200/`. The app
will automatically reload if you change any of the source files.

### Connecting to the PostgreSQL database

Run Docker Compose with:

```shell
docker compose -f docker-compose.yml -f docker-compose-http.yml -f docker-compose-db-port.yml up
```

You can connect to the PostgreSQL database with `psql -h localhost -U tailormap tailormap` with the default password `tailormap`.

The port PostgreSQL should listen to can be customized using the `DB_PORT` variable in the `.env` file.

### Using a local Tailormap backend

The Spring Boot backend middleware is developed in a separate [tailormap-api](https://www.github.com/B3Partners/tailormap-api) repository.

When running a dev server, the tailormap-api is reverse proxied on the `/api` path from `https://snapshot.tailormap.nl/api` which runs the
latest `snapshot`, so you don't even need to run the backend and database locally.

If you want to change the viewer configuration you need to log in of course! Just run Tailormap locally as described above and set the
`PROXY_USE_LOCALHOST` environment variable:

```shell
PROXY_USE_LOCALHOST=true npm run start
```

There is a Swagger UI for the API on http://localhost:8080/swagger-ui/.

If you've made some changes to the backend, only start the `db` container from this stack and run the backend from the tailormap-api repository with `mvn -Pdeveloping spring-boot:run`.

### Code scaffolding

Run `npm run ng -- generate component components/[name] --project core|map` to generate a new component. You can also
use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

To create a new service which uses the HttpClient to make API calls run

`npm run ng -- generate service services/[name] --project core|map --http-service`

This creates a service with a HttpClient injected and adjusted spec file to test HTTP calls.

### Running unit tests

Run `npm run test` to execute the unit tests via [Jest](https://jestjs.io).

### Building multi-arch images

Use the commands below to build and push the cross-platform Docker images to the GitHub container registry. See the Docker documentation for more information about [building multi-platform images](https://docs.docker.com/build/building/multi-platform/) and the [docker buildx build](https://docs.docker.com/engine/reference/commandline/buildx_build/) and  [docker buildx create](https://docs.docker.com/engine/reference/commandline/buildx_create/) commands.

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
# for pushing to the GitHub container registry, you need to be logged in with docker login
docker buildx build --pull --build-arg VERSION=${VERSION} --build-arg BASE_HREF=${BASE_HREF} \
      --platform linux/amd64,linux/arm64 \
      -t ghcr.io/b3partners/tailormap-viewer:${VERSION} . \
      --push
# leave the buildx context
docker buildx use default
```
