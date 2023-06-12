# GitHub Workflow Tests For Camel Quarkus

Tests for workflow steps that use `actions/script` in the Camel Quarkus project.

It can verify steps produce the desired results to avoid the need for live testing on GitHub.

## How it works

The JavaScript code for the `actions/script` step is parsed out from the workflow YAML, then wrapped within a function in a way
that allows mocked objects for the GitHub actions APIs to be passed to it.

The function is then invoked at test time where [Jasmine](https://jasmine.github.io/) expectations assert that the relevant GitHub APIs were triggered with the
expected arguments.

## Writing tests

You can add or modify `*.spec.js` files within the `spec` directory.

## Running tests

First, set an environment variable named `CQ_GITHUB_DIR`, so that the test suite can find the Camel Quarkus GitHub actions workflow files. For example:

```
export CQ_GITHUB_DIR=/home/user/projects/camel-quarkus/.github
```

You can either run tests locally with `Node.js` or alternatively run the tests within a Docker container.

### Test with local `Node.js`

If you don't already have `Node.js` installed, choose your preferred installation method from here:

https://nodejs.org/en/download/package-manager

Next, install the project dependencies (you only need to run this once).

```
npm install
```

You can now run the tests:

```
npm test
```

### Test with `Node.js` in Docker

Build the test suite container image (you only need to run this once):

```
docker build -t ${USER}/cq-github-workflow-tests .
```

Then run the tests:

```
docker run -ti --rm \
    -v ${PWD}:/home/node/app \
    -v ${CQ_GITHUB_DIR}:/home/node/app/.github \
    ${USER}/cq-github-workflow-tests
```
