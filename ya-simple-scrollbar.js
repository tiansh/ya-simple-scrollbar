; (function () {

  // override styles here in your css file for customize styles
  var cssText = [
    '.yass-wrapper { overflow: hidden; height: 100%; position: relative; z-index: 1; }',
    '.yass-content { height: 100%; width: 100%; padding: 0 40px 0 0; position: relative; overflow-y: scroll; -moz-box-sizing: content-box; box-sizing: content-box; }',
    '.yass-sensor { width: 100%; display: block; position: relative; }',
    '.yass-scrollbar { position: absolute; background: rgba(127, 127, 127, 0.1); top: 0; right: 0; z-index: 2; width: 8px; height: 100%; cursor: pointer; opacity: 0; transition: opacity 0.1s linear; }',
    '.yass-scrollbar-button { position: absolute; left: 0; width: 8px; border-radius: 4px; background: rgba(127, 127, 127, 0.2); }',
    '.yass-wrapper:hover .yass-scrollbar, .yass-scrollbar.yass-scrollbar-drag { opacity: 1; }',
    '.yass-resize-sensor, .yass-resize-sensor-expand, .yass-resize-sensor-shrink { position: absolute; top: 0; bottom: 0; left: 0; right: 0; overflow: hidden; z-index: -1; visibility: hidden; }',
    '.yass-resize-sensor-expand .yass-resize-sensor-child { width: 100000px; height: 100000px; }',
    '.yass-resize-sensor-shrink .yass-resize-sensor-child { width: 200%; height: 200%; }',
    '.yass-resize-sensor-child { position: absolute; top: 0; left: 0; transition: 0s; }',
  ].join('');
  ; (function () {
    var style = document.createElement('style');
    style.textContent = cssText;
    document.addEventListener('DOMContentLoaded', function () {
      var container = document.getElementsByTagName('head')[0] || document.body;
      container.appendChild(style);
    });
  }());


  var requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    function (f) { return setTimeout(f, 20); };

  /**
   * Attach scrollbar to some element
   * @param {HTMLElement} element
   */
  function attachScrollbarTo(element) {
    var attribute = 'data-ya-simple-scrollbar';
    if (element.hasAttribute(attribute)) return;
    element.setAttribute(attribute, attribute);
    initScrollbar(element);
  }

  /**
   * helper function, create div with given classname
   * @param {string} classname
   */
  var createDivWithClassname = function (classname) {
    var element = document.createElement('div');
    element.className = classname;
    return element;
  }

  /**
   * Class for dimension change detection.
   *
   * @param {Element} element
   * @param {Function} callback
   *
   * @constructor
   */
  var resizeSensor = function (element, resized) {
    var sensor = createDivWithClassname('yass-resize-sensor');
    var expand = sensor.appendChild(createDivWithClassname('yass-resize-sensor-expand'));
    var shrink = sensor.appendChild(createDivWithClassname('yass-resize-sensor-shrink'));
    var expandChild = expand.appendChild(createDivWithClassname('yass-resize-sensor-child'));
    var shrinkChild = shrink.appendChild(createDivWithClassname('yass-resize-sensor-child'));
    element.appendChild(sensor);

    var lastWidth = element.offsetWidth;
    var lastHeight = element.offsetHeight;
    var newWidth, newHeight, dirty;

    var reset = function () {
      expand.scrollLeft = 100000;
      expand.scrollTop = 100000;
      shrink.scrollLeft = 100000;
      shrink.scrollTop = 100000;
    };

    reset();

    var onResized = function () {
      if (lastWidth === newWidth && lastHeight === newHeight) return;
      lastWidth = newWidth;
      lastHeight = newHeight;
      resized();
      reset();
    };
    var onScroll = function (event) {
      newWidth = element.offsetWidth;
      newHeight = element.offsetHeight;
      if (dirty) return; dirty = true;
      requestAnimationFrame(function () {
        dirty = false;
        onResized();
      });
    };

    expand.addEventListener('scroll', onScroll);
    shrink.addEventListener('scroll', onScroll);
  };

  /**
   * initialize scrollbar on element
   * @param {HTMLElement} element
   */
  function initScrollbar(element) {

    // add wrapper and content box to current element
    var wrapper = createDivWithClassname('yass-wrapper');
    var content = wrapper.appendChild(createDivWithClassname('yass-content'));
    var sensor = content.appendChild(createDivWithClassname('yass-sensor'));
    while (element.firstChild) sensor.appendChild(element.firstChild);
    element.appendChild(wrapper);
    var scrollbar = wrapper.appendChild(createDivWithClassname('yass-scrollbar'));
    var scrollbutton = scrollbar.appendChild(createDivWithClassname('yass-scrollbar-button'));
    element.style.overflow = 'hidden';

    var scrollbarPosition = (function () {
      var containerHeight, contentHeight;
      var scrollbarTop = null, scrollbarHeight = null;

      // update position of scroll button
      var positionDirty = false;
      var repaintScrollButton = function () {
        positionDirty = false;
        var contentOffset = content.scrollTop;
        if (containerHeight >=   contentHeight) {
          scrollbarTop = scrollbarHeight = null;
          scrollbar.style.display = 'none';
        } else {
          scrollbarHeight = containerHeight * containerHeight / contentHeight;
          // scrollbar should not be too short
          scrollbarHeight = Math.max(Math.min(containerHeight / 2, yaSimpleScrollbar.minHeight), scrollbarHeight);
          scrollbarTop = contentOffset / (contentHeight - containerHeight) * (containerHeight - scrollbarHeight);
          scrollbar.style.display = 'block';
          scrollbutton.style.height = scrollbarHeight + 'px';
          scrollbutton.style.top = scrollbarTop + 'px';
        }
      };
      var repaintScrollButtonNextFrame = function () {
        if (positionDirty) return;
        positionDirty = true;
        requestAnimationFrame(function () {
          repaintScrollButton();
        });
      };

      var onResize = function () {
        if (sensor.offsetWidth !== wrapper.offsetWidth) {
          sensor.style.width = wrapper.offsetWidth + 'px';
        };
        containerHeight = content.clientHeight;
        contentHeight = content.scrollHeight;
        repaintScrollButtonNextFrame();
      };
      resizeSensor(wrapper, onResize);
      resizeSensor(sensor, onResize);
      requestAnimationFrame(onResize);

      var moveAction = function (newTop) {
        newTop = Math.max(0, Math.min(containerHeight - scrollbarHeight, newTop));
        if (scrollbarTop === newTop) return;
        content.scrollTop = newTop * (contentHeight - containerHeight) / (containerHeight - scrollbarHeight);
      };

      return {
        getTop: function () { return scrollbarTop; },
        getHeight: function () { return scrollbarHeight; },
        repaint: repaintScrollButton,
        move: moveAction,
      };
    }());

    // add events for scrollbar
    ; (function () {

      var lastPageY, lastScrollY;

      scrollbutton.addEventListener('mousedown', function (event) {
        lastPageY = event.pageY;
        lastScrollY = scrollbarPosition.getTop();
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', drop);
        scrollbar.className = 'yass-scrollbar yass-scrollbar-drag';
        event.preventDefault();
        event.stopPropagation();
      });

      var busy = false, currentPageY = null;
      var drag = function (event) {
        currentPageY = event.pageY;
        if (busy) return; busy = true;
        requestAnimationFrame(function () {
          busy = false;
          var deltaY = currentPageY - lastPageY;
          scrollbarPosition.move(Math.round(lastScrollY + deltaY));
        });
      };

      var drop = function () {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', drop);
        scrollbar.className = 'yass-scrollbar';
      }

    }());

    content.addEventListener('scroll', scrollbarPosition.repaint);

  }

  window.yaSimpleScrollbar = {
    attach: attachScrollbarTo,
    minHeight: 40, // px
  };

}());
