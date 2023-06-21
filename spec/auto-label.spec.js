const fs = require('fs');
const os = require('os');
const path = require('path');
const utils = require('../etc/utils');

/**
 * Prerequisites
 */

let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cq-workflows'));
const extensions = ['infinispan', 'jms', 'netty', 'netty-http', 'http'];
extensions.forEach(extension => {
  fs.mkdirSync(path.join(tmpDir, extension));
});

const scriptReplacements = [
  {
    pattern: "./.github/auto-label-configuration.yaml",
    replacement: utils.getGitHubDir() + "/auto-label-configuration.yaml",
  },
  {
    pattern: "./docs/modules/ROOT/pages/reference/extensions/",
    replacement: tmpDir,
  }
]

const script = utils.readWorkflowScriptAction({workflowFileName: "label-issue.yaml", jobId: 'label-issue', replacements: scriptReplacements});


/**
 * Verifies the specified expected labels were applied to an issue based on the given issue title or body
 */
function assertIssueLabelsApplied({issueTitle = "", issueBody = "", issueLabels = [], expectedIssueLabels = [], createLabels = false}) {
  const Context = {
    payload: {
      issue: {
        body: issueBody,
        title: issueTitle,
        labels: issueLabels,
        number: 1234,
      }
    },
    repo: {
      owner: "apache",
      repo: "camel-quarkus",
    }
  };

  const Github = {
    graphql: jasmine.createSpy(),
    rest: {
      issues: {
        createLabel: jasmine.createSpy(),
        setLabels: jasmine.createSpy()
      }
    }
  }

  const github = Object.create(Github);
  const context = Object.create(Context);

  github.graphql.and.returnValue({
    repository: {
      labels: {
        nodes: createLabels == true ? [] : expectedIssueLabels,
      }
    }
  });

  // Run the actions/script code with mocks
  eval(script);
  runGitHubScriptAction(context, github);

  if (createLabels) {
    expectedIssueLabels.forEach(label => {
      let createLabelArgs = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        name: label,
        color: '283482'
      };
      expect(github.rest.issues.createLabel).toHaveBeenCalledWith(createLabelArgs);
    })
  }

  const setLabelsArgs = {
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.issue.number,
    labels: expectedIssueLabels,
  }

  expect(github.rest.issues.setLabels).toHaveBeenCalledWith(setLabelsArgs);
}

/**
 * Verifies the auto label script exited and did not call the GitHub API to update the issue
 */
function assertIssueLabelsNotApplied({issueTitle = "", issueBody = "", issueLabels = []}) {
  const Context = {
    payload: {
      issue: {
        body: issueBody,
        title: issueTitle,
        labels: issueLabels,
        number: 1234,
      }
    },
    repo: {
      owner: "apache",
      repo: "camel-quarkus",
    }
  };

  const Github = {
    rest: {
      issues: {
        setLabels: jasmine.createSpy()
      }
    }
  }

  const github = Object.create(Github);
  const context = Object.create(Context);

  // Run the actions/script code with mocks
  eval(script);
  runGitHubScriptAction(context, github);

  expect(github.rest.issues.setLabels).not.toHaveBeenCalled();
}


/**
 * Tests
 */
afterAll(() => {
  if (tmpDir !== null) {
    fs.rmSync(tmpDir, {recursive: true});
  }
});


describe("Camel Quarkus Issue Auto Labelling", () => {
  /**
   * area/build label tests
   */
  it("Applies an area/build label from issue title", () => {
    const expectedLabels = ['area/build', 'build'];

    assertIssueLabelsApplied({issueTitle: '[CI] make some adjustments to the build workflow', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Use a github action to do something', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Use github actions to do something', expectedIssueLabels: expectedLabels})
  });


  /**
   * area/extension label tests
   */
  it("Applies an area/extension label from issue title", () => {
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the infinispan extension', expectedIssueLabels: ['area/infinispan']})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-infinispan extension', expectedIssueLabels: ['area/infinispan']})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-quarkus-infinispan extension', expectedIssueLabels: ['area/infinispan']})

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the netty extension', expectedIssueLabels: ['area/netty']})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-netty extension', expectedIssueLabels: ['area/netty']})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-quarkus-netty extension', expectedIssueLabels: ['area/netty']})

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the netty-http extension', expectedIssueLabels: ['area/netty-http']})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-netty-http extension', expectedIssueLabels: ['area/netty-http']})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-quarkus-netty-http extension', expectedIssueLabels: ['area/netty-http']})
  });

  it("Does not apply an area/extension label with unknown extension from issue title", () => {
    assertIssueLabelsNotApplied({issueTitle: 'There is a problem with the gitlab extension', expectedIssueLabels: []})
  });


  /**
   * area/core label tests
   */
  it("Applies an area/core label from issue title", () => {
    const expectedLabels = ['area/core'];

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-quarkus-core extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel-quarkus-main extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel quarkus core extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel quarkus main extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the camel main extension', expectedIssueLabels: expectedLabels})
  });


  /**
   * area/native label tests
   */
  it("Applies an area/native label from issue title", () => {
    const expectedLabels = ['area/native', 'native'];

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the native extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the graal extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the graalvm extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the mandrel extension', expectedIssueLabels: expectedLabels})
  });

  it("Applies an area/native label from issue body", () => {
    const expectedLabels = ['area/native', 'native'];

    assertIssueLabelsApplied({issueBody: 'There is a problem with the native extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueBody: 'There is a problem with the graal extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueBody: 'There is a problem with the graalvm extension', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueBody: 'There is a problem with the mandrel extension', expectedIssueLabels: expectedLabels})
  });


  /**
   * area/quarkus-platform label tests
   */
  it("Applies an area/quarkus-platform label from issue title", () => {
    const expectedLabels = ['area/quarkus-platform'];

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the quarkus-platform', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the quarkus platform', expectedIssueLabels: expectedLabels})
  });

  it("Applies an area/quarkus-platform label from issue body", () => {
    const expectedLabels = ['area/quarkus-platform'];

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the quarkus-platform', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with the quarkus platform', expectedIssueLabels: expectedLabels})
  });


  /**
   * documentation label tests
   */
  it("Applies documentation label from issue title", () => {
    const expectedLabels = ['area/documentation', 'documentation'];

    assertIssueLabelsApplied({issueTitle: 'Improve foo extension doc', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Improve foo extension docs', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Improve foo extension documentation', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Improve foo extension guide', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Improve foo extension guides', expectedIssueLabels: expectedLabels})
  });


  /**
   * area/testing label tests
   */
  it("Applies an area/testing label from issue title", () => {
    const expectedLabels = ['area/testing', 'test'];

    assertIssueLabelsApplied({issueTitle: 'There is a problem with an integration test', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with an integration tests', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with an integration testing', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with an itest', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'There is a problem with an itests', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Increase extension test code', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Increase extension tests code', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Increase extension testing code', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Increase extension junit code', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Add more extension coverage', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'CamelTestSupport is not working', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'CamelQuarkusTestSupport is not working', expectedIssueLabels: expectedLabels})
  });


  /**
   * housekeeping label tests
   */
  it("Applies an area/housekeeping label from issue title", () => {
    const expectedLabels = ['area/housekeeping', 'housekeeping'];

    assertIssueLabelsApplied({issueTitle: 'Ban org.foo:foo', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'Remove org.foo:foo', expectedIssueLabels: expectedLabels})
  });


  /**
   * jakarta label tests
   */
  it("Applies an area/housekeeping label from issue title", () => {
    const expectedLabels = ['area/jakarta', 'jakarta'];

    assertIssueLabelsApplied({issueTitle: 'org.foo:foo not ready for jakarta 10', expectedIssueLabels: expectedLabels})
    assertIssueLabelsApplied({issueTitle: 'org.foo:foo not ready for JakartaEE 10', expectedIssueLabels: expectedLabels})
  });


  /**
   * OpenShift label tests
   */
  it("Applies an area/openshift label from issue title", () => {
    const expectedLabels = ['area/openshift'];

    assertIssueLabelsApplied({issueTitle: 'Extension fails on OpenShift', expectedIssueLabels: expectedLabels})
  });


  /**
   * release/* label tests
   */
  it("Applies an release/* label from issue title", () => {
    assertIssueLabelsApplied({issueTitle: '[camel-main] Something is broken', expectedIssueLabels: ['release/camel-next']})
    assertIssueLabelsApplied({issueTitle: '[quarkus-main] Something is broken', expectedIssueLabels: ['release/quarkus-next']})
  });


  /**
   * platform/* label tests
   */
  it("Applies an platform label from issue title", () => {
    // ARM / AARCH
    assertIssueLabelsApplied({issueTitle: 'Foo fails on arm', expectedIssueLabels: ['platform/arm']})
    assertIssueLabelsApplied({issueTitle: 'Foo fails on arm64', expectedIssueLabels: ['platform/arm']})
    assertIssueLabelsApplied({issueTitle: 'Foo fails on aarch', expectedIssueLabels: ['platform/arm']})
    assertIssueLabelsApplied({issueTitle: 'Foo fails on aarch64', expectedIssueLabels: ['platform/arm']})

    // Mac
    assertIssueLabelsApplied({issueTitle: 'Foo fails on mac os', expectedIssueLabels: ['platform/mac']})
    assertIssueLabelsApplied({issueTitle: 'Foo fails on macos', expectedIssueLabels: ['platform/mac']})
    assertIssueLabelsApplied({issueTitle: 'Foo fails on mac', expectedIssueLabels: ['platform/mac']})
    assertIssueLabelsApplied({issueTitle: 'Foo fails on osx', expectedIssueLabels: ['platform/mac']})
    assertIssueLabelsApplied({issueTitle: 'Foo fails on os x', expectedIssueLabels: ['platform/mac']})

    // Windows
    assertIssueLabelsApplied({issueTitle: 'Foo fails on windows', expectedIssueLabels: ['platform/windows']})
  });



  /**
   * Misc label tests
   */
  it("Removes stale labels", () => {
    const existingLabels = [
      {
        name: "area/infinispan",
      },
      {
        name: "platform/windows",
      }
    ]

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the jms extension', issueLabels: existingLabels, expectedIssueLabels: ['area/jms']})
  });

  it("Preserves existing user added labels", () => {
    const existingLabels = [
      {
        name: "user/addedA",
      },
      {
        name: "user/addedB",
      },
      {
        name: "housekeeping",
      }
    ]

    assertIssueLabelsApplied({issueTitle: 'There is a problem with the jms extension', issueLabels: existingLabels, expectedIssueLabels: ['area/jms', 'user/addedA', 'user/addedB', 'housekeeping']})
  });

  it("Update not run if no new labels were added", () => {
    const existingLabels = [
      {
        name: "area/infinispan",
      },
      {
        name: "platform/windows",
      }
    ]

    assertIssueLabelsNotApplied({issueTitle: 'There is a problem with the infinispan extension on windows', issueLabels: existingLabels})
  });

  it("Markdown code blocks do not affect issue labels", () => {
    const issueBody = `
      Some preamble for the issue description.

      A code example to demonstrate the issue:

      \`\`\`java
      public class Foo() {
        public static void main(String args[]) {
          // Code goes here
        }
      }
      \`\`\`

      Now a stacktrace containing content that could trigger regex matches:

      \`\`\`
      Caused by: java.lang.RuntimeException: Failed to start quarkus
        at org.apache.camel.quarkus.jms.FictionalClass.foo(FictionalClass:100)
        at org.infinispan.FictionalClass.foo(FictionalClass:200)
        at io.vertx.FictionalClass.foo(FictionalClass:300)
      \`\`\`

      Finally a comment with a single backtick code block \`foo-bar\`.
    `

    assertIssueLabelsNotApplied({issueTitle: 'This issue title should result in no labels', issueBody: issueBody, existingLabels: [], issueLabels: []})
  });

  it("Creates labels with color", () => {
    assertIssueLabelsApplied({createLabels: true, issueTitle: 'There is a problem with the jms extension', expectedIssueLabels: ['area/jms']})
  });
});
