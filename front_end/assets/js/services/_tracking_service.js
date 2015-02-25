;(function(app) {

  var creatingNotebook;

  function beautifyName(name) {
    return name.match(/[A-Z][a-z]+/g).join(" ");
  }

  function msToSeconds(time) {
    return time / 1000;
  }

  function buildPostData(measurement, serviceName) {
    return {
      host: "bunsen",
      service: serviceName,
      metric: msToSeconds(measurement.duration),
      state: "ok",
      description: beautifyName(measurement.name) + " took " + msToSeconds(measurement.duration) + ".",
      tags: ['http', 'librato']
    };
  }

  app.service('TrackingService', [
    '$rootScope',
    'Beaker',
    'Factories',
    function(
      $rootScope,
      Beaker,
      F) {

    return {
      manageNotebookMarks: function(toState, toParams) {
        var _this = this;
        if (toState.name == 'projects.items.item.notebook' && !creatingNotebook) {
          Beaker.getBeakerInstance().then(function(instance) {
            if ( _($rootScope.cachedNotebooks).pluck('id').contains(parseInt(toParams.notebook_id)) ) {
              var markName = instance !== 'null' ? 'LoadCachedProvisionedNotebook' : 'LoadCachedUnprovisionedNotebook';
            }
            else {
              var markName = instance !== 'null' ? 'LoadProvisionedNotebook' : 'LoadUnprovisionedNotebook';
            }
            _this.mark(markName);
          });
        }
        else {
          _this.setNotebookState(false);
        }
      },

      mark: function(name) {
        performance.clearMarks(name);
        performance.mark(name);
        var mark = performance.getEntriesByName(name)[0];
      },

      measure: function(name, from, to) {
        if(performance.getEntriesByName(from).length && performance.getEntriesByName(to).length) {
          performance.clearMeasures(name);
          performance.measure(name, from, to);
          var measurement = performance.getEntriesByName(name)[0];

          F.Events.one('events').customPOST(buildPostData(measurement, name));
        }
      },

      setNotebookState: function(bool) {
        creatingNotebook = bool;
      }
    };
  }]);
})(window.bunsen);
