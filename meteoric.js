(function ($, undefined) {
	"use strict";

	// Add helper functionality to jQuery
	$.meteoric = {
		// Functions that convert metadata into UI
		writers: {},
		// Functions called by name from metadata-driven UI
		actions: {}
	};

	// Add business object container writer
	$.meteoric.writers.businessObject = function (context, entity) {
		// Closure for the context as it is passed into this writer function
		var c, f, p, field, formBtn;
		c = context;
		p = c.parent;

		// Build form if not in Read mode
		if(c.mode != "read"){
			var entityForm = $("<form />").addClass("meteoric-form");
			entityForm.attr("id", entity.name).attr("name", entity.name);
			entityForm.attr("action", entity.action || document.location.href);
			entityForm.attr("method", entity.method || "POST");
			p.append(entityForm);

			// Recursion - update the context.parent to the form
			// we've just written so it can be passed to the fields
			// as they are written
			p = entityForm;
		}

		// write the fields for this object
		if (entity.fields) {
			c.parent = p;
			for (f in entity.fields) {
				field = entity.fields[f];
				// Call the build function on the context to recurse into other writers:
				c.build(c, field);
			}
		}

		formBtn = $("<input/>");

		switch(c.mode){
			case "create":
				// create button
				if (entity.onCreate && $.meteoric.actions[entity.onCreate]) {
					formBtn.attr("type", "button").click(function (event) {
						$.meteoric.actions[entity.onCreate](event, entity);
					});
				} else {
					formBtn.attr("type", "submit");
					entityForm.attr("action", entity.action || document.location.href);
					entityForm.attr("method", entity.method || "POST");
				}
				formBtn.val("Create");
				entityForm.append(formBtn);
				break;
			case "update":
				// update button
				if (entity.onUpdate && $.meteoric.actions[entity.onUpdate]) {
					formBtn.attr("type", "button").click(function (event) {
						$.meteoric.actions[entity.onUpdate](event, entity);
					});
				} else {
					formBtn.attr("type", "submit");
					entityForm.attr("action", entity.action || document.location.href);
					entityForm.attr("method", entity.method || "POST");
				}
				formBtn.val("Update");
				entityForm.append(formBtn);
				break;
			case "delete":
				// create button
				if (entity.onDelete && $.meteoric.actions[entity.onDelete]) {
					formBtn.attr("type", "button").click(function (event) {
						$.meteoric.actions[entity.onDelete](event, entity);
					});
				} else {
					formBtn.attr("type", "submit");
					entityForm.attr("action", entity.action || document.location.href);
					entityForm.attr("method", entity.method || "DELETE");
				}
				formBtn.val("Delete");
				entityForm.append(formBtn);
				break;
			case "read":
			default:
				// Don't show any buttons.
		}
	};

	// Writer for string fields in objects
	$.meteoric.writers.string = function (context, entity) {
		var fieldDisplay, inputElement, maxLength;

		fieldDisplay = $("<div/>").addClass("meteoric-fieldLabel").text(entity.displayName);

		if (context.mode == "read") {
			fieldDisplay.append(" " + entity.value);
		} else {
			inputElement = $("<input type=\"text\" />");
			inputElement.addClass("meteoric-fieldDisplay");
			if (entity.name) {
				inputElement.attr("id", entity.name).attr("name", entity.name);
			}
			maxLength = parseInt(entity.maxLength);
			if (entity.maxLength && maxLength) {
				inputElement.attr("maxlength", maxLength);
			}
			inputElement.attr("value", entity.value || "");
			inputElement.attr("placeholder", entity.placeholder || "");
			fieldDisplay.append(inputElement);
		}
		context.parent.append(fieldDisplay);
	};

	// Writer for password fields in objects
	$.meteoric.writers.password = function (context, entity) {
		var fieldDisplay, inputElement;

		fieldDisplay = $("<div/>").addClass("meteoric-fieldLabel").text(entity.displayName);

		if (context.mode == "read") {
			fieldDisplay.append(" [hidden]");
		} else {
			inputElement = $("<input type=\"password\" />");
			inputElement.addClass("meteoric-fieldDisplay");
			if (entity.name) {
				inputElement.attr("id", entity.name).attr("name", entity.name);
			}
			fieldDisplay.append(inputElement);
		}
		context.parent.append(fieldDisplay);
	};

	// extend jQuery to add the jQuery.meteoric method
	// This is invoked like: $("#meteoricDiv").meteoric({ metadata: myEntity});
	$.fn.meteoric = function (options) {

		var settings, context;

		// Default settings, overridden by options arg
		settings = $.extend({
			metadata: null,
			mode: "create"			// CRUD
			/*,debugMode: false     // Unused */
		}, options);

		if (!settings.metadata) { throw "Meteoric.js: option 'metadata' MUST be set."; }

		// This is the object which performs contextual writes to the DOM.
		// The function "build" does all the important work and supports nested entities.
		context = {
			root: this,
			parent: this,
			// TODO: siblings: [],
			entireMetadata: settings.metadata,
			mode: settings.mode,
			build: function (context, entity, typeOverride) {
				var e, writer, writerType;

				// Supports overriding the writer to be used
				writerType = typeOverride || entity.type;

				if (writerType) {
					// Find a writer for this type of metadata
					writer = $.meteoric.writers[writerType];

					if (writer) {
						writer(context, entity);
					} else {
						throw "Meteoric.js: Unable to find a writer for type '" + entity.type + "'";
					}
				} else {
					throw "Meteoric.js: Metadata does not contain a 'type' property. Execution stopped.";
				}
			}
		}

		context.build(context, settings.metadata);
	}
})(jQuery);