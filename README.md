Allows panning and zooming of any element in an HTML document. Unlike other libraries
I've found, this one automatically locks the bounds of zooming/panning to the bounding
box of it's parent element. This way your dragable element cannot be dragged out of view.
This is a VanillaJS library so will work well in any project.

### Yet Another Pan Zoom Library

Yup, there are multiple other Pan/Zoom libraries out there (see below). However, I had
trouble getting them to lock the panning bounds to the parent element bounding box.
This Pan/Zoom implementation also utilizes CSS transforms in order to take advantage
of browser GPU acceleration.

### Some other Pan/Zoom libraries

If this library doesn't fit the bill, try one of these:

- [dy/pan-zoom](https://github.com/dy/pan-zoom)
  Simple library that gives you access to pan/zoom data through a callback.
- [timmywil/panzoom](https://github.com/timmywil/panzoom)
  Just found this one and haven't had the chance to try it out. Looks promising
  but I can't find it on NPM.
- [PanZoom](https://www.npmjs.com/package/panzoom)
  A DOM/SVG Pan/Zoom library. I was unable to get this to lock to the
  bounding box I wanted.
- [jquery.panzoom](https://www.npmjs.com/package/jquery.panzoom)
  A Pan/Zoom library for jQuery.
- [React SVG Pan Zoom](https://www.npmjs.com/package/react-svg-pan-zoom)
  A React implementation of Pan/Zoom.
- [SVG Pan Zoom](https://www.npmjs.com/package/svg-pan-zoom)
  An SVG Pan/Zoom library.
