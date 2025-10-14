# Project Overview

This project is the Tailormap Viewer, it provides frontend for Tailormap which relies on the RESTful Tailormap API.
The Tailormap API (tailormap-api) is written in Java using Spring Boot and developed in a separate repository that
can be found at: https://github.com/Tailormap/tailormap-api.

# Introduction

This guide helps GitHub Copilot generate code that is easy to read, use, and maintain. By following these rules, the
code will be simple, functional, and easy to modify in the future, ensuring long-term quality and understanding across
the team.

# Why This Guide?

The goal of this guide is to ensure that generated code is both human-readable and optimized for machine performance. It
facilitates collaboration, makes coding simpler, and ensures that best practices are consistently followed.

# Development Environment
Tailormap Viewer is written in **TypeScript 5.x** using **Angular 20.x** and **OpenLayers 10.x**.
Dependencies for this project are managed using npm in the file `package.json` in the root of the repository.
Code for this project is built using Angular CLI using the file `angular.json` in the root of the repository.
Builds for this project are executed using npm using the file `package.json` in the root of the repository.
The main configuration file for the Tailormap Viewer is `src/environments/environment.ts` and
`src/environments/environment.prod.ts` for production builds.
The main module for the Tailormap Viewer is `projects/src/app/app.module.ts`.

The Tailormap Viewer uses OpenAPI definitions from the Tailormap API, located at
`src/assets/openapi/viewer-api.yaml`, to generate TypeScript API client code using the OpenAPI Generator.
The generated API client code is located in the `src/app/api` directory.
The Tailormap Viewer uses Angular Material for UI components and styling.
The Tailormap Viewer uses RxJS for reactive programming and state management.
The Tailormap Viewer uses Jest for unit testing.

## Code Standards
### Required Before Each Commit
run `npm run lint-fix` to ensure code is formatted according to the project's style guide.
run `npm run test` to ensure all tests pass and code adheres to the project's coding standards.

# Best Practices

## General Guidelines

Do not suggest changes to the project structure, such as renaming files or directories, unless it is necessary for the
implementation of the feature or fix.
Do not suggest changes to the project's build system, such as switching to a different build tool.
Never suggest code using deprecated libraries or methods.

## Modularity

- **Single Responsibility Principle**: Write classes and methods that have a single responsibility, unless these are
  defined as utility class.
- **Code Reusability**: Encourage code reuse by creating modular components that can be used in multiple places.
- **Dependency Injection**: Use dependency injection to manage dependencies and improve code maintainability.
- **Angular Modules**: Organize code into Angular modules to encapsulate related components, services, and directives.
- **Services**: Use Angular services to handle business logic and data management, keeping components focused on the UI.
- **Components**: Create reusable Angular components for UI elements, ensuring they are self-contained and easy to maintain.
- **Directives**: Use Angular directives to encapsulate and reuse DOM manipulation logic.
- **Pipes**: Use Angular pipes to transform data in templates, promoting code reuse and separation of concerns.
- **State Management**: Use RxJS and Angular's built-in state management features to manage application state effectively.
- **Lazy Loading**: Implement lazy loading for Angular modules to improve application performance and reduce initial load time.
- **Feature Modules**: Group related functionality into feature modules to enhance organization and maintainability.
- **Shared Modules**: Create shared modules for common components, directives, and pipes that are used across multiple feature modules.
- **Core Module**: Use a core module for singleton services and application-wide components.
- **Routing**: Use Angular's RouterModule to manage application navigation and route guards for access control.
- **Testing**: Write unit tests for components, services, and other classes to ensure code quality and reliability.


## Error Handling

- **Robustness**: Suggest error handling practices, such as using try-catch blocks and validating inputs.
- **Logging**: Recommend logging important events and errors for easier debugging.
- **Error Messages**: Provide clear and informative error messages to help users understand what went wrong.

## Testing

- **Unit Tests**: Encourage the inclusion of unit tests for all new features and functions.
- **Test-Driven Development**: Promote writing tests before implementing features to ensure requirements are met.

## Performance Considerations

- **Efficiency**: Suggest efficient algorithms and data structures to optimize performance.
- **Resource Management**: Close resources properly to avoid memory leaks and improve performance.
- **Scalability**: Consider scalability when designing features to ensure the system can handle increased load.
- **Caching**: Recommend caching strategies to reduce latency and improve performance.

## Security Best Practices

- **Input Validation**: Always validate user inputs to prevent security vulnerabilities.
- **Secure Coding**: Follow secure coding practices to protect against common threats like SQL injection and cross-site
  scripting (XSS).

# Code Review Guidelines

- **Naming Conventions**: Follow naming conventions for classes, methods, variables, and packages.
- **Code Readability**: Write code that is easy to read and understand, using meaningful variable names and comments.
- **Code Consistency**: Ensure that code is consistent across the project, following the same style and conventions.
- **Code Duplication**: Avoid code duplication by reusing existing components or creating utility classes.
- **Code Complexity**: Keep code complexity low by breaking down complex logic into smaller, more manageable parts.
- **Code Performance**: Optimize code for performance by using efficient algorithms and data structures.
- **Code Security**: Follow secure coding practices to prevent common security vulnerabilities.
- **Code Testing**: Include unit tests and integration tests for all new features and functions.
- **Code Documentation**: Document code using comments and JSDoc (or TSDoc) to explain complex logic and decisions.

