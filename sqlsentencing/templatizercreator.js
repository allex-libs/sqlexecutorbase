function createTemplatizers (execlib, templateslib, mylib) {
  'use strict';
  var lib = execlib.lib;

  function processTemplate(template, replacements) {
    var tmplt;
    if (lib.isArray(template)) {
      tmplt = template.join('\n');
    }
    if (lib.isString(template)) {
      tmplt = template;
    }
    if (!tmplt) {
      return '';
    }
    return templateslib.process({
      template: tmplt,
      replacements: replacements
    });
  }

  mylib.processTemplate = processTemplate;
}
module.exports = createTemplatizers;