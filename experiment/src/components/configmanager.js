//graph config manager
function gl_processSettings(component, config, defaults) {
  var setting;
  for (k in defaults) {
    setting = gl_objClone(defaults[k]);
    if (setting.accessor === 'simple') {
      setting = setting.value;
      component[k] = gl_accessorFn(component, config, k);
    }
    if (!config[k]) config[k] = setting;
  }
  component.config = config;
};

function gl_accessorFn(component, config, key) {
 return function(value) {
   if (!arguments.length) return config[key];
   config[key] = value;
   return component;
 }
}

function gl_applyDefaults(component, config) {
  var type;
  type = component.type;
  config = config || {};
  if (defaults[type]) gl_processSettings(component, config, defaults[type](config))
};
