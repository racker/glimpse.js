**Install the build tools**

- Install [nodejs](http://nodejs.org)
- Install [PhantomJS](http://phantomjs.org)
- Install [grunt](http://gruntjs.com) `npm install -g grunt-cli`
- Install [Testacular](https://github.com/testacular/testacular) `npm install -g testacular@canary`
- Install other build dependencies `npm install`
- Setup the pre-commit hook by running `ln -s ../../pre-commit.js .git/hooks/pre-commit` from the repo root.

**Writing Unit Tests**

- Write unit tests in `/test/unit/`
- Run tests from the command line: `grunt test`
- Look at coverage report generated in `/test/coverage` to ensure you maintain 100% test-coverage.
- Optionally run `grunt testwatch` to auto-run tests when any file changes
- See [Testacular](https://github.com/testacular/testacular) and [Jasmine](http://pivotal.github.com/jasmine/) for more details.

**Style Guide**

- JavaScript code should follow the [Idiomatic.js style guide](https://github.com/rwldrn/idiomatic.js/)
- Commit messages should follow the [Angular JS convention](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit?pli=1#)
- JSDocs should follow [???TBD???]()
