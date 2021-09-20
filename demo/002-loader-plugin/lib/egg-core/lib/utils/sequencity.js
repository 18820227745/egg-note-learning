'use strict';

// TODO 不太明白
function sequence(tasks, names, results, missing, recursive, nest, optional) {
  names.forEach(function(name) {
    if (results.includes(name)) {
      return; // de-dup results
    }
    const node = tasks[name];
    // if it's an optional dependency, it can be ignore when
    if (optional === true) {
      if (!node) return;

      if (node && node.enable === false) return;
    }

    if (!node) {
      missing.push(name);
    } else if (nest.includes(name)) {
      nest.push(name);
      recursive.push(nest.slice(0));
    } else if (node.dependencies.length || node.optionalDependencies.length) {
      nest.push(name);
      if (node.dependencies.length) {
        sequence(tasks, node.dependencies, results, missing, recursive, nest);
      }
      if (node.optionalDependencies.length) {
        sequence(tasks, node.optionalDependencies, results, missing, recursive, nest);
      }
      nest.pop(name);
    }
    results.push(name);
  });
}

// tasks: object with keys as task names
// name: array of task names
module.exports = function(tasks, names) {
  let result = []; // this final sequence
  const missing = []; // missing tasks
  const recursive = []; // recursive task dependencies

  sequence(tasks, names, results, missing, recursive, []);

  if (missing.length || recursive.length) {
    result = [];
  }

  return {
    sequence: results,
    missingTasks: missing,
    recursiveDependencies: recursive,
  };

}
