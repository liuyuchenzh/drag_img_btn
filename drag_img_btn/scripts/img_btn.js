// getData, removeData, addEvent, removeEvent are from
// JavaScript Ninja by John Resig and Bear Bibeault
// some minor adjustments have been made
// currently cannot work in Firefox 44.0
// works fine with lastest Chrome (48+), Opera (34.0+), and IE Edge (25+)
(function() {
  var cache = {};
  var id = 0;
  var prop = "data-" + Date.now();
  this.getData = function(elem) {
    if (!elem[prop]) {
      elem[prop] = ++id;
    }
    if (!cache[elem[prop]]) {
      cache[elem[prop]] = {};
    }
    return cache[elem[prop]];
  }

  this.removeData = function(elem) {
    delete cache[elem[prop]];
    try {
      delete elem[prop];
    } catch (e) {
      if (elem.removeAttribute) {
        elem.removeAttrribute(prop);
      }
    }
  }
})();

(function() {
  var fnSerial = 0;
  this.addEvent = function(elem, type, fn) {
    var data = getData(elem);
    if (!data.events) {
      data.events = {};
    }
    if (!data.events[type]) {
      data.events[type] = [];
    }
    if (!fn.fnSerial) {
      fn.fnSerial = fnSerial++;
    }
    data.events[type].push(fn);
    if (!data.fireEvent) {
      data.fireEvent = function(event) {
        var type = event.type;
        for (var i = 0; i < data.events[type].length; i++) {
          data.events[type][i].call(elem, event);
        }
      }
    }
    if (document.addEventListener) {
      elem.addEventListener(type, data.fireEvent, false);
    } else if (document.attachEvent) {
      elem.attachEvent("on" + type, data.fireEvent);
    }
  };

  this.removeEvent = function(elem, type, fn) {
    var data = getData(elem);
    var clearType = function(elem, type) {
      var isEmpty = function(obj) {
        if (Object.getOwnPropertyNames) {
          return Object.getOwnPropertyNames(obj).length === 0;
        }
        for (prop in obj) {
          if (!prop) {
            return true;
          }
        }
        return false;
      }
      // could be deleted but prefer to leave it here
      // therefore clearType could be reused else where
      var data = getData(elem);
      if (!data.events) {
        return;
      }
      if (data.events[type].length === 0) {
        delete data.events[type];
      }
      if (isEmpty(data.events)) {
        delete data.events;
      }
      if (isEmpty(data)) {
        removeData(elem);
      }
    }

    if (!type) {
      var events = data.events;
      for (var t in events) {
        events[t] = [];
        clearType(elem, t);
      }
      return;
    }

    if (!fn) {
      data.events[type] = [];
      clearType(elem, type);
      return;
    }

    if (!fn.fnSerial) {
      return;
    }

    var events = data.events[type];
    for (var i = 0; i < events.length; i++) {
      if (events[i].fnSerial === fn.fnSerial) {
        events.splice(i--, 1);
      }
    }
    clearType(elem, type);
  };
})()

var imgBtn = (function() {
  var _imgBtn = {},
      getHtml,
      create,
      dragStart,
      drag,
      dragEnd,
      dragOver,
      drop,
      dragEnter,
      dragLeave,
      remove,
      moveOneDown,
      moveBack,
      tragged,
      relatedElem,
      tempElem,
      added = false,
      isRightElem,
      isTempElem,
      regexp = /^yc-drag-(add-)?img-btn$/,
      tempRegexp = /^yc-drag-img-btn-temp$/,
      addBtn,
      width,
      dropzone,
      hold,
      count = 0,
      getIndex,
      whereToMove;

  getHtml = function() {
    return "<a href='#' draggable=false><span>Item" + count++ + "</span></a>";
  }
  create = function(overallContainer) {
    var addBtn = overallContainer.lastElementChild;
    var container = document.createElement("div");
    container.insertAdjacentHTML("afterbegin", getHtml());
    container.className = "yc-drag-img-btn";
    container.draggable = true;
    overallContainer.insertBefore(container, addBtn);
    // not ideal
    // reflow repaint everytime
    if (overallContainer.childElementCount % 4 === 0) {
      addBtn.style.marginRight = 0;
    } else {
      addBtn.style.marginRight = "";
    }
    if (!added) {
      addEvent(document, "dragstart", dragStart);
      addEvent(document, "drag", drag);
      addEvent(document, "dragend", dragEnd);
      addEvent(document, "dragover", dragOver);
      addEvent(document, "drop", drop);
      addEvent(document, "dragenter", dragEnter);
      addEvent(document, "dragleave", dragLeave);
      added = true;
      dropzone = overallContainer;
    }
  };

  remove = function(target, parent) {
    removeEvent(target);
    removeData(target);
    parent.removeChild(target);
  };

  isRightElem = function(elem) {
    if (regexp.test(elem.className)) {
      return true;
    }
    return false;
  };

  isTempElem = function(elem) {
    if (tempRegexp.test(elem.className)) {
      return true;
    }
    return false;
  };

  getIndex = function(elem) {
    var btnArr = dropzone.children;
    for (var i = 0; i < btnArr.length; i++) {
      if (elem === btnArr[i]) {
        return i;
      }
    }
  };

  whereToMove = function(x, left, right) {
    if (x <= (left + right) / 2) {
      return "right";
    } else {
      return "left";
    }
  }

  dragStart = function(event) {
    dragged = event.target;
    var data = getData(dragged);
    data.originalIndex = getIndex(dragged);
  };

  drag = function(event) {
    dropzone.removeChild(dragged);
  }

  dragEnd = function(event) {
    var btnArr = dropzone.children;
    for (var i = 0; i < btnArr.length; i++) {
      removeData(btnArr[i]);
    }
  }

  dragOver = function(event) {
    event.preventDefault();
  }

  dragEnter = function(event) {
    var target = event.target;
    // when add a tempElem to temperately occupy the room
    // the dragged elem will enter tempElem
    // if so, do nothing but mark this is the entering tempElem situation
    // which means change hold to true
    // in chrome, firefox, opera, IE Edage, dragenter will happen before dragleave
    // this feature will be used to make sure a loop of creating and removing
    // temElem won't happen
    if (isTempElem(target)) {
      hold = true;
      return;
    } else {
      hold = false;
    }
    if (!isRightElem(target) || target === dragged) {
      return;
    }
    relatedElem = target;
    var x = event.pageX;
    var left = target.getBoundingClientRect().left;
    var right = target.getBoundingClientRect().right;
    moveOneDown(target, x, left, right);
  }

  dragLeave = function(event) {
    var target = event.target;
    // if not .yc-drag-img-btn, .yc-drag-add-img-btn or .yc-drag-img-btn-temp
    // don't invoke moveBack
    if ((!isRightElem(target) && !isTempElem(target)) || target === dragged) {
      return;
    }
    // if dragged enter tempElem first
    // then hold will be true
    // despite the fact that dragged also dragleave the elem that usded to be
    // where tempElem is now
    // don't invoke moveBack
    // or it will cause a loop of adding and removing tempElem
    if (hold) {
      hold = false;
      return;
    }
    moveBack();
  }

  drop = function(event) {
    event.preventDefault();
    try {
      dropzone.replaceChild(dragged, tempElem);
    } catch(e) {
      // no tempElem in place
      var data = getData(dragged);
      var originalIndex = data.originalIndex;
      dropzone.insertBefore(dragged, dropzone.children[originalIndex]);
    }

  }

  moveOneDown = function(elem, x, left, right) {
    if (!tempElem) {
      tempElem = document.createElement("div");
      tempElem.className = "yc-drag-img-btn-temp";
    }
    var dir = whereToMove(x, left, right);
    if (dir === "right") {
      dropzone.insertBefore(tempElem, elem);
    } else {
      dropzone.insertBefore(tempElem, elem.nextElementSibling);
    }
  }

  moveBack = function() {
    try{
      tempElem && dropzone.removeChild(tempElem);
    } catch(e) {

    }
  }

  return {
    create: create,
    remove: remove
  }
})()
