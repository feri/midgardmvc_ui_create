document.write('<script type="text/javascript" src="/midgardmvc-static/midgardmvc_ui_create/js/deps/underscore-min.js"></script>');
document.write('<script type="text/javascript" src="/midgardmvc-static/midgardmvc_ui_create/js/deps/backbone.js"></script>');
document.write('<script type="text/javascript" src="/midgardmvc-static/midgardmvc_ui_create/js/deps/vie-containermanager.js"></script>');

if (typeof midgardCreate === 'undefined') {
    midgardCreate = {};
}

midgardCreate.objectManager = {
    models: {},
    views: {},

    init: function() {
        Backbone.emulateHTTP = true;
        Backbone.emulateJSON = true;

        VIE.ContainerManager.findAdditionalModelProperties = function(element, properties) {
            properties.url = function() {
                var url = '/mgd:create/object/' + encodeURIComponent(this.getType()) + '/';
                if (this.id) {
                    url += encodeURIComponent(this.id) + '/';
                }
                return url;
            };

            properties.getPlaceholder = function(propertyName) {
                return '&lt;' + propertyName + '&gt;';
            };

            properties.initialize = function() {
                var modelInstance = this;
                var populateProperties = {};
                jQuery.each(properties, function(propName, propValue) {

                    if (typeof propValue === 'function') {
                        return true;
                    }

                    if (!modelInstance.get(propName)) {
                        populateProperties[propName] = propValue;
                    }

                });

                if (!jQuery.isEmptyObject(populateProperties)) {
                    modelInstance.set(populateProperties);
                }
            };

            properties.runWorkflow = function(workflow, callback) {
                var url = '/mgd:create/run/' + encodeURIComponent(this.getType()) + '/' + encodeURIComponent(this.id) + '/' + workflow;
                jQuery.ajax({
                    url: url,
                    dataType: 'json',
                    type: 'POST',
                    success: function (data) {
                        if (data === null) {
                            return;
                        }
                        callback(data);
                    }
                });
            };

            properties.getWorkflowState = function(callback) {
                var workflowState = {
                    label: 'item',
                    history: [],
                    actions: {}
                };

                var url = '/mgd:create/state/' + encodeURIComponent(this.getType()) + '/';
                if (this.id) {
                    url += encodeURIComponent(this.id) + '/';
                }

                jQuery.ajax({
                    url: url,
                    async: false,
                    dataType: 'json',
                    success: function(data) {
                        if (   typeof data === 'null'
                            || typeof data.object === 'undefined') {
                            return;
                        }
                        workflowState.label = data.object.type;
                        workflowState.state = data.state.current;
                        workflowState.actions = data.state.actions;
                        workflowState.history = data.state.history;
                        callback(workflowState);
                    },
                    error: function() {
                    }
                });
            };
        };

        VIE.ContainerManager.findAdditionalViewProperties = function(element, viewProperties) {
            viewProperties.render = function() {
                var model = this.model;
                VIE.ContainerManager.findContainerProperties(this.el, true).each(function() {
                    var propertyElement = jQuery(this);
                    var propertyName = propertyElement.attr('property');
                    var propertyDefault = propertyElement.attr('default');

                    if (model.get(propertyName) instanceof Array) {
                        // For now we don't deal with multivalued properties in Views
                        return true;
                    }

                    if (propertyElement.html() !== model.get(propertyName)) {
                        propertyElement.html(model.get(propertyName));
                    }
                });

                if (   typeof model.collection !== 'undefined'
                    && model.collection.urlpattern
                    && model.id) {
                    jQuery('a[rel="bookmark"]', this.el).each(function() {
                        jQuery(this).attr('href', model.collection.urlpattern.replace('GUID', model.id.replace('urn:uuid:', '')));
                    });
                };

                return this;
            };
        };
    }
};
