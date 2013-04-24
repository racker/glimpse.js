# <%= version%> (<%= today%>)

## Features
<% _(changelog.feat).forEach(function(changes, directive) { %>### <%= directive%>
<% changes.forEach(function(change) { %>
* <%= change.msg%> (<%= change.sha1%>)
<% }) %>
<% }) %>

## Complete Changelog

<% _(changelog.other).forEach(function(changes, directive) { %>
<% changes.forEach(function(change) { %>
  * <%= change.msg%> (<%= change.sha1%>)
<% }) %>
<% }) %>
