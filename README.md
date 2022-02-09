# Tailormap viewer

This project is an Angular frontend for Tailormap.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Using a Tailormap backend

When running a dev server, the tailormap-api is proxied on the `/api` path. See [proxy.config.json](proxy.config.json). You can change the URL to connect to a
different tailormap-api instance (you can also run one locally).

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

To create a new service which uses the HttpClient to make API calls run

`ng generate service [name] --http-service`

This creates a service with a HttpClient injected and adjusted spec file to test HTTP calls

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `npm run test` to execute the unit tests via [Jest](https://jestjs.io).

## Running with Docker Compose

Use Docker Compose to build, push and run images.

Requires a Docker compose version supporting version 3.9 of the compose specification (profiles). Do not use 1.25 included in some Ubuntu
repositories. Download version 1.28.5 (later version like 1.29.2 may give OpenSSL conflict if server uses Ubuntu 20.04 LTS included Docker
packages).


### Running a full Tailormap stack

A full stack also runs configuration database, backend api and administration interface containers. The Angular frontend in this repository
is build and put in a Nginx webserver container and serves as the main entry point. It reverse proxies the the `/api/` and `/admin/` paths.
Run the stack using:

`docker-compose --profile http --profile full up -d`

Go to http://localhost/ for the viewer and http://localhost/admin/ for administration. The default account is admin/flamingo.
During the first startup you might see some exceptions connecting to the database while this is being initialized, these are harmless as
it will be retried later.

The build configuration for the `db` container for the configuration database (with preloaded data) is also in this
repository. The `api` and `admin` containers are the snapshot-tagged versions, which get updated in
the registry automatically. If you want to update your running containers, execute:

 - `docker-compose pull` to pull new images for `api` and `admin`
 - `docker-compose build web` to build a new Angular frontend image
 - `docker-compose build db` to build a new configuration database image (see note below)

Run `docker-compose --profile http --profile full up -d` again to use the updated images.

**Stopping**

`docker-compose down`

You can use `docker-compose down --rmi all -v` to remove all built and pulled images and remove the volume with the configuration
database. Use `--rmi local` to only remove locally built images.

#### Refreshing the configuration database

The `db` container is just a basic PostgreSQL container but with some initialization scripts to preload some Tailormap configuration. The
database is saved on a volume. The initialization only runs when this volume does not already contain an initialized database. Stop the `db`
container (or the entire stack), remove the volume with `docker volume rm tailormap-viewer_config-db` (or use `docker-compose down -v`) and
bring it up again to re-initialize the database.

### Running only the Angular frontend

Environment variables can be used to reconfigure the `/api/` and `/admin/` Nginx reverse proxies. You can set the URL, HTTP host header (for
when your proxy target is behind name-based virtual hosting and for correct absolute URL generation) or disable them.

This can be used to run only the web container and reverse proxy `/api/` to an instance deployed elsewhere:

```
API_PROXY_URL=https://snapshot.tailormap.nl/api/ \
  API_PROXY_HOST=snapshot.tailormap.nl \
  ADMIN_PROXY_ENABLED=false \
  docker-compose --profile http up
```

These environment variables can be configured in a `.env` file. Copy the `.env.template` file to `.env` and modify the variables so you do
not have to specify them everytime.

### Using Traefik

The `http` profile starts the `web` container exposing port 80. You can use the `proxied` profile to run a webserver container which does
not expose port 80. It has labels to configure Traefik automatically. Run this profile with Traefik in the same network so your stack is
deployed with name-based virtual hosting and with automatic SSL redirection and termination and provisioning of Let's Encrypt SSL
certificates.
