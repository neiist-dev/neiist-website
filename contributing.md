# Contributing to NEIIST

Thank you for your interest in contributing to the NEIIST (Núcleo Estudantil de Informática do Instituto Superior Técnico) open-source projects! We welcome contributions from everyone, whether you're a student, alumni, or part of the broader community. This guide will help you get started with contributing to our projects.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Contributing Code](#contributing-code)
- [Getting Started](#getting-started)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
  - [Finding Issues to Work On](#finding-issues-to-work-on)
- [Submitting Contributions](#submitting-contributions)
  - [Pull Request Process](#pull-request-process)
  - [Code Style Guidelines](#code-style-guidelines)
- [Contact](#contact)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](code_of_conduct.md). Please read it to understand the expectations for respectful and inclusive collaboration.

## How Can I Contribute?

### Reporting Bugs

If you find a bug in any of our projects, we’d love to hear about it! To report a bug:

1. Check the [Issues](https://github.com/neiist-dev/neiist-website/issues) section to ensure the bug hasn’t already been reported.
2. Open a new issue with a clear title and description, including:
   - Steps to reproduce the bug
   - Expected behavior
   - Actual behavior
   - Screenshots or logs (if applicable)
3. Use the "Bug" label when creating the issue.

### Suggesting Features

We’re always open to new ideas! To suggest a feature:

1. Check the [Issues](https://github.com/neiist-dev/neiist-website/issues) section to see if the feature has already been proposed.
2. Open a new issue with the "Feature Request" label.
3. Provide a clear description of the feature, its purpose, and any relevant use cases.

### Contributing Code

You can contribute code to fix bugs, implement features, or improve the project in other ways. Follow the steps in the [Getting Started](#getting-started) section to begin.

## Getting Started

### Setting Up the Development Environment

Follow the steps in the [Installation](https://github.com/neiist-dev/neiist-website/blob/master/installation.md) guide to begin.

### Finding Issues to Work On

- Browse the [Issues](https://github.com/neiist-dev/neiist-website/issues) section for tasks not assigned.
- Comment on an issue to let maintainers know you’re working on it.
- If you have an idea that’s not listed, open a new issue to discuss it before starting work.

## Submitting Contributions

### Pull Request Process

Before making changes, please **fork the repository** and **create a new branch** for your work. This ensures that your changes don't interfere with the main codebase. Make sure your branch is based on the latest version of the repository, and give your branch a descriptive name (e.g., `feature/new-feature` or `fix/bug-fix`). Make your changes in this branch, and then submit a pull request.

### Commit your Changes

1. **Commit Your Changes**:
   * Write clear, concise commit messages following the [Conventional Commits]([https://www.conventionalcommits.org/en/v1.0.0/](https://www.conventionalcommits.org/en/v1.0.0/)) specification.
   * Example: `feat: add user authentication endpoint` or `fix: typo in README`.
2. **Push Your Branch**:
   ```bash
   git push origin feature/<your-feature-name>
   ```
3. **Open a Pull Request**:
   - Go to the repository’s GitHub page and click "New Pull Request."
   - Select your branch and provide a detailed description of your changes.
   - Reference any related issues (e.g., `Closes #123`).
4. **Respond to Feedback**: Maintainers may request changes. Address them promptly to keep the review process smooth.
5. **Merge**: Once approved, a maintainer will merge your pull request.

### Code Style Guidelines

- Follow the project’s existing code style (check for a `.editorconfig` or linter configuration like ESLint or Prettier).
- Write clear, commented code where necessary.
- Ensure your code passes all tests by running:
  ```bash
  yarn lint
  yarn format
  yarn test
  ```
- Include tests for new features or bug fixes when applicable.

## Contact

If you have questions or need help, feel free to reach out:

- **GitHub Issues**: Post in the relevant repository’s Issues section.
- **Email**: Contact us at [neiist@tecnico.ulisboa.pt](mailto:neiist@tecnico.ulisboa.pt).

Thank you for contributing to NEIIST’s open-source projects! Your efforts help us build better tools for the community at Instituto Superior Técnico.
