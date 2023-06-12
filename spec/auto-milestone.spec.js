const utils = require('../etc/utils')

/**
 * Prerequisites
 */
const script = utils.readWorkflowScriptAction({workflowFileName: 'assign-issue-milestone.yaml', jobId: 'assign-issue-milestone'});


describe("Camel Quarkus Issue Auto Milestone Assignment", () => {

  it("Adds closed issues to the latest open milestone", () => {
    const Context = {
      payload: {
        number: 1234,
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
          listMilestones: jasmine.createSpy(),
          update: jasmine.createSpy(),
        }
      }
    }

    const github = Object.create(Github);
    const context = Object.create(Context);

    github.graphql.and.returnValue({
      "repository": {
        "pullRequest": {
          "commits": {
            "nodes": [
              {
                "commit": {
                  "message": "Fix an important issue\n\nFix #1"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nFixes #2"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nFixed #3"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nFixes https://github.com/apache/camel-quarkus/issues/4"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nResolve #5"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nResolves #6"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nResolved #7"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nClose #8"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nCloses #9"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nClosed #10"
                },
              },
              {
                "commit": {
                  "message": "Fix an important issue\n\nClosed #11"
                },
              },
              {
                "commit": {
                  "message": "Fix an without an issue reference"
                },
              },
            ]
          },
          "closingIssuesReferences": {
            "nodes": [
              {
                "number": 11
              },
              {
                "number": 12
              }
            ]
          }
        }
      }
    });

    github.rest.issues.listMilestones.and.returnValue({
      data: [
        {
          number: 1,
          title: "No fix/wont't fix",
        },
        {
          number: 2,
          title: "3.0.0",
        },
        {
          number: 3,
          title: "2.0.0",
        },
        {
          number: 4,
          title: "1.0.0",
        },
      ]
    });

    // Run the actions/script code with mocks
    eval(script);
    runGitHubScriptAction(context, github);

    // Verify each fixed issue got allocated to the correct milestone (3.0.0)
    for (let i = 1; i <= 12; i++) {
      let expectedArgs = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: i,
        milestone: 2,
      }
      expect(github.rest.issues.update).toHaveBeenCalledWith(expectedArgs);
    }
  });


  it("No updates made if PR has no associated issues", () => {
    const Context = {
      payload: {
        number: 1234,
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
          listMilestones: jasmine.createSpy(),
          update: jasmine.createSpy(),
        }
      }
    }

    const github = Object.create(Github);
    const context = Object.create(Context);

    github.graphql.and.returnValue({
      "repository": {
        "pullRequest": {
          "commits": {
            "nodes": [
              {
                "commit": {
                  "message": "Fix an important issue"
                },
              },
              {
                "commit": {
                  "message": "Fix another important issue"
                },
              },
            ]
          },
          "closingIssuesReferences": {
            "nodes": [
            ]
          }
        }
      }
    });

    github.rest.issues.listMilestones.and.returnValue({
      data: [
        {
          number: 1,
          title: "No fix/wont't fix",
        },
        {
          number: 2,
          title: "3.0.0",
        },
        {
          number: 3,
          title: "2.0.0",
        },
        {
          number: 4,
          title: "1.0.0",
        },
      ]
    });

    // Run the actions/script code with mocks
    eval(script);
    runGitHubScriptAction(context, github);

    // No issue references are associated with the PR so ensure no issue updates happened
    expect(github.rest.issues.update).not.toHaveBeenCalledWith()
  });
});
