# TailormapViewer

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.0.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

To create a new service which uses the HttpClient to make API calls run

`ng generate service [name] --http-service`

This creates a service with a HttpClient injected and adjusted spec file to test HTTP calls

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `npm run test` to execute the unit tests via [Jest](https://jestjs.io).

## Running as Docker container

**Build**

This command runs the unit tests and build the application

`docker build -f Dockerfile -t tailormap:prod .`

**Run**

This command runs the application on port 8080 locally

`docker run -it -p 8080:80 --rm tailormap:prod`
