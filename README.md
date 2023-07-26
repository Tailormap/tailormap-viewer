# Tailormap viewer

The Angular frontend for Tailormap.

## Running using Docker Compose

Install [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) (version 2) and
run:

```shell
docker compose up -d
```

This runs Tailormap on http://localhost:8080/ together with a PostgreSQL container to store configuration. The port (and other options) can
be changed by copying `.env.template` to `.env` and changing the variables. Tailormap will only accept connections from the loopback
interface.

Remove the Tailormap stack using `docker compose down` (add `-v` to remove the volume with the database).

By default, the latest development Docker image will be used (tagged with `snapshot`). This is published automatically by a GitHub Action on
every change to the `main` branch, so this might be an unstable version. To use the latest (stable) released version, copy `.env.template`
to `.env` and set the `VERSION` variable to `latest` before running. To update a running stack after a new version is released,
run `docker compose` with the `pull` and `up` commands but _check the release notes beforehand_ because it may contain important information
about upgrading to a new version.

## Running just the Tailormap container

The Docker Compose stack includes a PostgreSQL database, but you can also run just the Tailormap container with an existing PostgreSQL
database. The default database name, user and password are all `tailormap`:

```shell
createuser tailormap
createdb tailormap --owner=tailormap
psql tailormap -c "alter role tailormap password 'tailormap'"
docker run -it --rm --network=host --name tailormap ghcr.io/b3partners/tailormap:snapshot
```

Specify the following command line parameters with `docker run` to change the database connection settings:

- `-e SPRING_DATASOURCE_URL=jdbc:postgresql://host:port/database`
- `-e SPRING_DATASOURCE_USERNAME=user`
- `-e SPRING_DATASOURCE_PASSWORD=pass`

If your database is running on localhost using `--network=host` is recommended (you can try using the hostname `host.docker.internal` but
that may not always work). If your database is on another host you can specify `--publish 8080:8080` instead of `--network=host`. Of course,
you need to specify `SPRING_DATASOURCE_URL` with the database hostname.

## Default admin account

To log in to the admin interface go to http://localhost:8080/admin/.

When starting up for the first time a password will be randomly generated for the admin account. This password is printed to the logs of
the `tailormap` container. You can see the password with:

`docker compose logs tailormap`

Look for the output containing:

```
tailormap-server  | INFO 1 --- [           main] n.b.t.api.security.AdminAccountCreator   :
tailormap-server  |
tailormap-server  | +------                                 ------+
tailormap-server  | | +-----------------------------------------+ |
tailormap-server  | | |  ______     _ __                        | |
tailormap-server  | | | /_  __/__ _(_) /__  ______ _  ___ ____  | |
tailormap-server  | | |  / / / _ `/ / / _ \/ __/  ' \/ _ `/ _ \ | |
tailormap-server  | | | /_/  \_,_/_/_/\___/_/ /_/_/_/\_,_/ .__/ | |
tailormap-server  | | |                                 /_/     | |
tailormap-server  | | +-----------------------------------------+ |
tailormap-server  | +------                                 ------+
tailormap-server  |
tailormap-server  | *** Use this account to access the admin:
tailormap-server  |
tailormap-server  | *** Username: tm-admin
tailormap-server  | *** Password: ***********

```

### Resetting an account password

If you ever forget the admin password but do not want to re-initialize the database, reset the password with:

```
 HASH=`docker run --rm rocko/spring-boot-cli-docker spring encodepassword [newpassword]`
docker compose exec --user postgres db \
  psql tailormap -U tailormap -c "update users set password = '${HASH}' where username = 'tm-admin'"
```

Resetting a password in this way will securely hash the password (depending on your shell the space before the first command will also
prevent the password from remaining in your shell history). If you're in a bind you can also set a plain text password with a value like
`{noop}changeme` but it is recommended you change it immediately so it will be hashed securely using bcrypt.

## Running in production behind a reverse proxy

To run Tailormap in production, you need to put it behind a reverse proxy that handles SSL termination.

Copy the `.env.template` file to `.env` and change the `HOST` variable to the hostname Tailormap will be running on. Tailormap must run on
the `/` path.

If you're using a reverse proxy without Docker just reverse proxy 127.0.0.1:8080 (this port binding is added in
`docker-compose.override.yml`). The ports can be changed in an `.env` file or by using another override file in `COMPOSE_FILE`.

Example Apache configuration:
```
<VirtualHost *:443>
    ServerName myhost.com
...
    RequestHeader set X-Forwarded-Proto https
    ProxyPreserveHost On

    # If you're also running other webapps such as geoserver, add ProxyPass lines before this line
    ProxyPass /			    http://localhost:8080/
</VirtualHost>
```

It's a good idea to use Traefik as a reverse proxy because it can be automatically configured by Docker labels and can automatically request
Let's Encrypt certificates. Add `docker-compose.traefik.yml` to `COMPOSE_FILE` in the `.env` file. See the file for details.

You can also run multiple Tailormap stacks on one host, even running different versions. Just specify another `.env` file with a
different `HOST` and `COMPOSE_PROJECT_NAME` and specify it using the `--env-file <env>` option. Note that if you use the `latest` tag and
pull a new image, stacks will only run with the updated version after recreating the containers with `docker compose up`. It might be
advisable to only set `VERSION` to a specific version and use a tool such
as [renovatebot](https://www.mend.io/free-developer-tools/renovate/) to automatically update your configuration when a new version is
released.

## Database

### Refreshing the database

Tailormap creates database tables automatically. To start fresh, bring the stack down removing the database volume with
`docker compose down -v` and restart Tailormap.

### Backing up the configuration database

The configuration database needs to be backed up if you don't want to lose your configuration. The backup procedure isn't any different when
using containers from using PostgreSQL without them: use `pg_dump` and do not back up just the files in `/var/lib/postgresql/`, tempting as
that may be.

Creating a backup:

```
docker compose exec --user postgres db pg_dump -U tailormap tailormap > tailormap.sql
```

### Restoring a backup

The restore procedure: drop the database, recreate it and load the backup. You may need to stop the `tailormap` container to close any
connections.

```
docker compose stop tailormap
docker compose exec --user postgres db dropdb -U tailormap tailormap
docker compose exec --user postgres db createdb -U tailormap --owner=tailormap tailormap
cat tailormap.sql | docker compose exec -T --user postgres db psql -U tailormap tailormap
docker compose start tailormap
```

### Upgrading to a new major PostgreSQL version

The Docker image for the configuration database is kept up to date with the latest PostgreSQL releases and can move to a new major version
with a new Tailormap release. In this case the database must be dumped and restored (see above). Take note of the major PostgreSQL version
in the release notes whether this is required. You will see an error opening Tailormap and see errors about the PostgreSQL version in the
logs of the `db` container if you don't do this upgrade. If you did not have a recent backup ready, downgrade the image used by the `db`
container to the previous major version and backup the database as normal and restore on the newer major version.

## Development

The following is required for successfully building Tailormap:

- NodeJS 18.x (https://nodejs.org/en/); the current LTS
- npm 8 (included with NodeJS)

### Dev server

Run `npm install` and `npm run start` to start a dev server, or `npm run start-nl` for the Dutch localized version. Navigate
to http://localhost:4200/. Run `npm run start-admin` to start the admin interface on http://localhost:4201/. The app will automatically
reload if you change any of the source files.

### Connecting to the PostgreSQL database

To bind the port of the PostgreSQL database of the Docker Compose stack, add `docker-compose.db-port.yml` to the `COMPOSE_FILE` environment
variable in the `.env` file when running `docker compose up`, see [above](#running-using-docker-compose).

You can connect to the PostgreSQL database with `psql -h localhost -U tailormap tailormap` with the default password `tailormap`.

The port PostgreSQL listens on can be customized using the `DB_PORT` variable in the `.env` file.

### Using a local Tailormap backend

The Spring Boot backend middleware is developed in a separate [tailormap-api](https://www.github.com/B3Partners/tailormap-api) repository.

When running a dev server, the tailormap-api is reverse proxied on the `http://localhost:4200/api` path from `https://snapshot.tailormap.nl/api`
which runs the latest `snapshot`, so you don't even need to run the backend and database locally.

If you want to change the viewer configuration you of course need to log in to the admin! Just run Tailormap locally as described above and
set the `PROXY_USE_LOCALHOST` environment variable:

```shell
PROXY_USE_LOCALHOST=true npm run start
```

There is a Swagger UI for the API on http://localhost:8080/swagger-ui/.

If you want to make some changes to the backend source code, only start the `db` container from this stack and run the backend from the [tailormap-api](https://www.github.com/B3Partners/tailormap-api)
repository as described in the README in that project.

### Code scaffolding

Run `npm run ng -- generate component components/[name] --project core|map` to generate a new component. You can also
use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

To create a new service which uses the HttpClient to make API calls run

`npm run ng -- generate service services/[name] --project core|map --http-service`

This creates a service with a HttpClient injected and adjusted spec file to test HTTP calls.
Please use `kebab-case` for filenames and `PascalCase` for class names.

### Running unit tests

Run `npm run test` to execute the unit tests via [Jest](https://jestjs.io).

### Create CycloneDX BOM

Run `npx @cyclonedx/cyclonedx-npm --output-file bom.xml --mc-type application --output-format XML` to create a CycloneDX BOM file.

## Building a Docker image

After you've made your some changes to the source you can build your own Docker image using the following command. You may want to remove
the `node_modules` and `.angular` directories to reduce the Docker build context size.

```
docker build -t ghcr.io/b3partners/tailormap:snapshot .
```

The Dockerfile in this repository uses the `ghcr.io/b3partners/tailormap-api` base image with the webserver and backend and adds the Angular
frontend bundles to it. To use your own base image with modifications, run `mvn install` in the [tailormap-api](https://www.github.com/B3Partners/tailormap-api)
repository to build the base image before building the `tailormap` image.

You can also add the argument `--build-arg API_VERSION=snapshot` to set the tag of the `ghcr.io/b3partners/tailormap-api` base image to use.

### Multi-arch build with Docker buildx

Use the commands below to build and push the cross-platform Docker images to the GitHub container registry. See the Docker documentation for
more information about [building multi-platform images](https://docs.docker.com/build/building/multi-platform/) and
the [docker buildx build](https://docs.docker.com/engine/reference/commandline/buildx_build/)
and  [docker buildx create](https://docs.docker.com/engine/reference/commandline/buildx_create/) commands.

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
docker buildx build --pull --build-arg VERSION=${VERSION} --build-arg API_VERSION=${VERSION} --build-arg BASE_HREF=${BASE_HREF} \
      --platform linux/amd64,linux/arm64 \
      -t ghcr.io/b3partners/tailormap:${VERSION} . \
      --push
# leave the buildx context
docker buildx use default
```
