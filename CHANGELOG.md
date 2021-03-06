## 0.0.12 (Mar 31 2014)

- Mixins for components
- Refactor to use mixins
- Graph builder refactor
- Event management overhaul
- Exposes layouts
- Adds component for scatter plot
- Adds component for tooltip. Related bug fixes
- Fixes following bugs:
 -- First color bug
 -- Re-register scales and apply on components
 -- ROC example
 -- Stop rounding of domain
 -- Selectively add components


## 0.0.11 (July 3 2013)

- Fix ticks bug - ticks are always visible.
- Implement zIndex for all components.
- Upgrade to d3 v3.2

## 0.0.10 (June 14 2013)

- Changes default font of legend to normal.
- Fixes bug in showLegend config option for graph.
- Adds sparkline.
- Fixes bug with rendering a newly added component(graphbuilder).

## 0.0.9 (June 7 2013)

- Fix legend interaction for stacked-area graphs.
- Expose core helper api.
- Upgrade to d3 v3.1

## 0.0.8 (May 22 2013)

- Fixes show/hide bug in Firefox.
- Fixes legend rendering bug in some cases.

## 0.0.7 (May 15 2013)

- Stacked Area Fix and bugs.

## 0.0.6 (May 14 2013)

- Stacked Area Graphs
- Show/Hide series Interaction
- Fixes top labels that get chopped
- Fixes hidden states for stats & domain label
- Fixes IE tests and other bugs

## 0.0.5 (April 22 2013)

- Validation for ids for dataCollection
- Domain refactor
- Adds pub-sub
- Fixes default color for components
- Fixes hidden states for axis and legend
- Validation cid for components

## 0.0.4 (April 17 2013)

Bugfix release to address bugs reported by reach team

- Fixes memory leaks found during performance testing
- Adds examples for each component
- Fixes yaxisunit not getting updated bug
- Adds events
- Fixes wonkiness when rendering no data state
- Fixes data not getting set on the components via data collection
- Fixes inconsistencies with min/max/avg label
- Fixes zero state

## 0.0.3 (April 08 2013)

- Adds component manager

## 0.0.2 (April 05 2013)

- Refactors and cleanups
- Adds performance tests
- Adds component manager
- Fixes various bugs
