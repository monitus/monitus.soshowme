(function($) {
	$.elementFromPoint = function(x, y) { // inspired from http://www.zehnet.de/2010/11/19/document-elementfrompoint-a-jquery-solution/
		if(!document.elementFromPoint) return null;
		
		var win = $(window);
		var doc = $(document);
		
		var relative = true;
		var scroll;
		if((scroll = doc.scrollTop()) > 0) relative = (document.elementFromPoint(0, scroll + win.height() - 1) == null);
		else if((scroll = doc.scrollLeft()) > 0) relative = (document.elementFromPoint(scroll + win.width() - 1, 0) == null);
		
		if(!relative) {
			x += doc.scrollLeft();
			y += doc.scrollTop();
		}
		
		return document.elementFromPoint(x, y);
	};
	$.fn.getPath = function () { // http://stackoverflow.com/questions/2068272/getting-a-jquery-selector-for-an-element
		if(this.length != 1) throw 'Requires one element.';
		
		var path, node = this;
		while (node.length) {
			var realNode = node[0];
			var name = (
				// IE9 and non-IE
				realNode.localName ||
				// IE <= 8
				realNode.tagName ||
				realNode.nodeName
			);
			
			// on IE8, nodeName is '#document' at the top level, but we don't need that
			if (!name || name == '#document') break;
			
			name = name.toLowerCase();
			if (realNode.id) {
				// As soon as an id is found, there's no need to specify more.
				return name + '#' + realNode.id + (path ? '>' + path : '');
			} else if (realNode.className) {
				name += '.' + realNode.className.split(/\s+/).join('.');
			}
			
			var parent = node.parent(), siblings = parent.children(name);
			if (siblings.length > 1) name += ':eq(' + siblings.index(node) + ')';
			path = name + (path ? '>' + path : '');
			
			node = parent;
		}
		
		return path;
	};
	$.widget("monitus.soshowme", {
		_stack: function(event, exceptions, limit) { // inspired by http://stackoverflow.com/questions/12847775/javascript-jquery-get-all-divs-location-at-x-y-forwarding-touches
			var x = event.clientX
			var y = event.clientY;
			var exceptions = exceptions || [];
			var limit = limit || 0;
			var fullStack = [];
			var stack = [];
			
			var element = $($.elementFromPoint(x, y));
			while(element.closest(this.element).length > 0) {
				if(!element.is(exceptions)) stack.push(element);
				
				if((limit > 0) && (stack.length >= limit)) break;
				
				fullStack.push(element);
				element.hide();
				element = $($.elementFromPoint(x, y));
			}
			
			for(var loop = 0; loop < fullStack.length; loop++) fullStack[loop].show();
			
			return stack;
		},
		_toggle_ui_element: function(basename, selector) {
			if(typeof(this[basename]) == "undefined") return;
			
			if(!selector) {
				this[basename].hide();
				this[basename + "_path"].hide();
			} else {
				var target = $(selector);
				if(target.length == 0) this._toggle_ui_element(basename, null);
				else {
					var offset = target.offset();
					
					this[basename].css({width: target.outerWidth(), height: target.outerHeight()});
					this[basename].offset(offset);
					
					this[basename + "_path"].text(selector);
					this[basename + "_path"].offset(offset);
					
					this[basename].show();
					this[basename + "_path"].show();
				}
			}
		},
		
		options: {
			selector: null,
			paths: true
		},
		_create: function() { // called only once per root element -- create stuff here
			var self = this;
			var options = self.options;
			var element = self.element;
			
			element.append("<div class='ui-soshowme ui-soshowme-zone'></div>" + (options.paths ? "<div class='ui-soshowme-path ui-soshowme-label'></div>" : "") + "<div class='ui-soshowme-selection ui-soshowme-zone'></div>" + (options.paths ? "<div class='ui-soshowme-selection-path ui-soshowme-label'></div>" : ""));
			self._picker = element.find(".ui-soshowme");
			self._picker_path = element.find(".ui-soshowme-path");
			self._picker.click($.proxy(this.pick, this));
			self._selection = element.find(".ui-soshowme-selection");
			self._selection_path = element.find(".ui-soshowme-selection-path");
			
			element.mouseleave(function() { self._toggle_ui_element("_picker", null); });
			$(window).resize(function() { self.select(); });
		},
		_init: function() { // called each time the widget is called without arguments - refresh stuff here
			this.select();
		},
		_setOption: function(option, value) {
			$.ui.dialog.prototype._setOption.call(this, option, value);
			
			switch(option) {
				case "selector":
					this.select();
					break;
			}
		},
		destroy: function() {
			$(window).unbind("resize");
			this._picker.remove();
			this._picker = null;
			this._picker_path.remove();
			this._picker_path = null;
			this._selection.remove();
			this._selection = null;
			this._selection_path.remove();
			this._selection_path = null;
		},
		
		select: function(selector) { // undefined == use data value; null == hide; else set new selector
			if(selector === null) this._toggle_ui_element("_selection", null);
			else {
				if(!selector) selector = this.options.selector;
				if(!selector || (selector == "")) this._toggle_ui_element("_selection", null);
				else {
					var target = $(selector);
					if((target.length > 0) && (selector != this.options.selector)) {
						this.options.selector = selector;
						this._toggle_ui_element("_selection", selector);
						
						this._trigger("select", null, {selector: this.options.selector});
					}
				}
			}
		},
		track: function(event) {
			var target = this._stack(event, ".ui-soshowme, .ui-soshowme-selection, .ui-soshowme-label", 1);
			if(!target || (target.length == 0)) this._toggle_ui_element("_picker", null);
			else {
				target = target[0];
				var offset = target.offset();
				
				var path = target.getPath();
				if(!path) this._toggle_ui_element("_picker", null);
				else if(path != this._picker.data("path")) {
					this._picker.data("path", path);
					this._toggle_ui_element("_picker", path);
					
					this._trigger("highlight", null, {selector: path});
				}
			}
		},
		tracking: function(onOff) {
			if(onOff) {
				this.element.mousemove($.proxy(this.track, this));
			} else {
				this.element.unbind("mousemove");
				this._toggle_ui_element("_picker", null);
			}
		},
		pick: function(event) {
			var path = this._picker.data("path");
			if(path) this.select(path);
		}
	});
})(jQuery);
