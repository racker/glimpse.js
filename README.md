**DO NOT USE THIS!** This is currently an unstable work in progress.  

glimpse.js is a JavaScript toolkit library for making beautiful graphs & visualizations effortlessly.

Its purpose is to empower developers to quickly render data as standards-compliant web-based visualizations.
Glimpse.js requires very little code and has virtually no learning curve, yet is customizable enough to allow for the most complex data visualizations.
We leverage countless hours of work that have already gone into the open-source community by building on top of the immensely popular
[d3.js](http://d3js.org/) library (a lower-level data visualization library).
We take that work one step further by providing a simpler API and by drastically reducing the amount of code necessary for the end-user to write.
Interactive time-series graphs can be created in as little as 2-3 lines of code.


## Features
- Includes a custom subset build of d3 (for a smaller footprint - we only include what we use)
- Can optionally omit d3 from being bundled if you already include it in your page
- d3 plugin support


## Dependencies
- d3 (comes bundled)


## Contribute

**Install the build tools**

- Install [nodejs](http://nodejs.org)
- Install [grunt](http://gruntjs.com) `npm install -g grunt-cli`
- Install [Testacular](http://vojtajina.github.com/testacular/) `npm install -g testacular@0.5.7`
- Install other build dependencies `npm install`
- Setup the pre-commit hook by running `ln -s ../../pre-commit.js .git/hooks/pre-commit` from the repo root.

**Writing Unit Tests**

- Write unit tests in `/test/unit/`
- Run tests from the command line: `grunt test`
- Look at coverage report generated in `/test/coverage` to ensure you maintain 100% test-coverage.
- Optionally run `testacular start` to auto-run tests when any file changes
- See [Testacular](http://vojtajina.github.com/testacular/) and [Jasmine](http://pivotal.github.com/jasmine/) for more details.

**Style Guide**

- JavaScript code should follow the [Idiomatic.js style guide](https://github.com/rwldrn/idiomatic.js/)
- Commit messages should follow the [Angular JS convention](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit?pli=1#)
- JSDocs should follow [???TBD???]()


## License

Copyright 2013 Rackspace

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
