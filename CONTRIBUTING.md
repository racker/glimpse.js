**Install the build tools**

- Install [nodejs](http://nodejs.org)
- Install [PhantomJS](http://phantomjs.org)
- Install [grunt](http://gruntjs.com) `npm install -g grunt-cli`
- Install [Karma](https://github.com/karma-runner/karma) `npm install -g karma`
- Install [Bower](https://github.com/twitter/bower) `npm install -g bower`
- Install other build dependencies `npm install`
- Install bower dependencies `bower install`
- Setup the pre-commit hook by running `ln -s ../../pre-commit.js .git/hooks/pre-commit` from the repo root.

**Writing Unit Tests**

- Write unit tests in `/test/unit/`
- Run tests from the command line: `grunt test`
- Look at coverage report generated in `/test/coverage` to ensure you maintain 100% test-coverage.
- Optionally run `grunt testwatch` to auto-run tests when any file changes
- See [Karma](https://github.com/karma-runner/karma) and [Jasmine](http://pivotal.github.com/jasmine/) for more details.

**Style Guide**

- JavaScript code should follow the [Idiomatic.js style guide](https://github.com/rwldrn/idiomatic.js/).
- JavaScript code should also follow our additional [code guidelines](https://github.com/racker/glimpse.js/wiki/Code-Guidelines).
- Commit messages should follow the [Angular JS convention](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit?pli=1#).
- JSDocs should follow [???TBD???]()
