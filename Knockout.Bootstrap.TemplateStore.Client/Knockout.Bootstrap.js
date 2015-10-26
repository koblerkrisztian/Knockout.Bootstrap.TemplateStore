ko.bootstrap = (function (ko) {
    if (ko == undefined)
        throw "ko.bootstrap is dependant on knockout";

    if (ko.bindingConventions == undefined)
        throw "ko.bootstrap is dependant on ko.bindingConventions";

    var api = function (appstart, url) {
        this.shared = "shared";
        this.currentView = null;
        this.templateCache = {};

        this.url = url || "templates";

        this.initEngine();
        this.loadTemplates(this.shared, appstart);
    };

    api.prototype = {
        initEngine: function () {
            var stringTemplateEngine = new ko.nativeTemplateEngine();
            var self = this;

            stringTemplateEngine.base_makeTemplateSource = stringTemplateEngine.makeTemplateSource;
            stringTemplateEngine.makeTemplateSource = function (template, templateDocument) {
                return new stringTemplateSource(template, templateDocument, self, stringTemplateEngine.base_makeTemplateSource);
            };

            ko.setTemplateEngine(stringTemplateEngine);
        },
        loadTemplates: function (root, callback) {
            var onLoaded = function (loaded) {
                this.templateCache[root] = loaded;
                this.currentView = loaded;
                callback();
            }.bind(this);

            if (this.templateCache[root] !== undefined) {
                onLoaded(this.templateCache[root]);
            } else {
                $.getJSON(this.url, { root: root }, onLoaded.bind(this));
            }
        },
        loadView: function (model, callback) {
            var modelEndsWith = "Model";
            var viewEnd = "View";

            var className = ko.bindingConventions.utils.findConstructorName(model);
            var root = className.substring(0, className.length - modelEndsWith.length);
            if (root.endsWith(viewEnd)) {
                root = root.substr(0, root.length - viewEnd.length);
            }

            this.loadTemplates(root, function () {
                callback(model);
            });
        },
        getView: function (root, viewName, callback) {
            var onLoaded = function (loaded) {
                this.templateCache[root] = loaded;
                callback(this.templateCache[root][viewName]);
            }.bind(this);

            if (this.templateCache[root] !== undefined) {
                onLoaded(this.templateCache[root]);
            } else {
                $.getJSON(this.url, { root: root }, onLoaded.bind(this));
            }
        }
    };

    var stringTemplateSource = function (template, templateDocument, api, nativeTemplateSourceFactory) {
        this.template = template;
        this.templateDocument = templateDocument;
        this.api = api;
        this.nativeTemplateSourceFactory = nativeTemplateSourceFactory;
    };

    stringTemplateSource.prototype.text = function (/* valueToWrite*/) {
        var template = this.api.currentView[this.template] || this.api.templateCache[this.api.shared][this.template];
        if (template == null) {
            var templateSource = this.nativeTemplateSourceFactory(this.template, this.templateDocument);
            if (arguments.length == 0)
                template = templateSource.text();
            else
                template = templateSource.text(arguments[0]);
        }

        return template;
    };

    stringTemplateSource.prototype.nodes = function (/* valueToWrite*/) {
        // If we can resolve the template return null. This way text() will be invoked
        // If we can not resolve the template, create the native engine and get the template from it
        var template = this.api.currentView[this.template] || this.api.templateCache[this.api.shared][this.template];

        if (template) {
            return null;
        }
        else {
            var templateSource = this.nativeTemplateSourceFactory(this.template, this.templateDocument);
            if (arguments.length == 0)
                template = templateSource.nodes();
            else
                template = templateSourcenodes(arguments[0]);
            return template;
        }
    }

    return {
        init: function (datasource, appstart) {
            return new api(datasource, appstart);
        }
    };
})(ko = window.ko);