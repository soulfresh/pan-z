import React from 'react';

function px(n) { return typeof(n) === 'number' ? `${n}px` : n; }

const flexCentered = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function Viewport({
  width = 200,
  height = 200,
  padding = height,
  style,
  children,
}) {
  return (
    <div
      style={{
        ...flexCentered,
        position: 'relative',
        minHeight: px(padding * 2),
        ...style,
      }}
    >
      <div
        style={{
          border: '2px solid red',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: px(width),
          height: px(height),
          zIndex: 1,
          pointerEvents: 'none',
        }}
      ></div>
      { children }
    </div>
  );
}

export const Box = React.forwardRef(({
  width = 200,
  height = 200,
  style,
}, ref) =>
  <div
    ref={ref}
    style={{
      display: 'block',
      margin: 0,
      height: '100%',
      overflow: 'visible',
      backgroundColor: '#eee',
      width: px(width),
      height: px(height),
      position: 'relative',
      ...style,
    }}
  >
    <div
      style={{
        width: px(width/2),
        height: px(height/2),
        position: 'absolute',
        backgroundColor: 'lightcoral',
      }}
    ></div>
    <div
      style={{
        width: px(width/2),
        height: px(height/2),
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: 'lightblue',
      }}
    ></div>
    <p
      style={{
        backgroundColor: '#ffffff70',
        padding: '10px',
        position: 'relative',
      }}
    >
      I'm a regular old div with text.
    </p>
  </div>
);

export const LargeContainer = React.forwardRef(({
  children,
  style,
}, ref) =>
  <div
    ref={ref}
    style={{
      width: '100%',
      height: '100vw',
      maxHeight: '500px',
      border: '2px solid red',
      overflow: 'hidden',
      position: 'relative',
      ...style,
    }}
  >
    { React.cloneElement(children, {style: {position: 'absolute'}}) }
  </div>
);

export const LargeContainerWithCenter = React.forwardRef(({
  children,
  x,
  y,
  z,
  style,
}, ref) => {
  const data = [];
  if (x != null) data.push(`X: ${x.toFixed(4)}`);
  if (y != null) data.push(`Y: ${y.toFixed(4)}`);
  if (z != null) data.push(`Z: ${z.toFixed(4)}`);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100vw',
        maxHeight: '500px',
        border: '2px solid red',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      { React.cloneElement(children, {style: {position: 'absolute'}}) }
      <div style={{
        position: 'absolute',
        backgroundColor: 'black',
        borderRadius: '50%',
        color: 'black',
        width: '5px',
        height: '5px',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <span style={{
          marginLeft: '10px',
          whiteSpace: 'nowrap',
          fontSize: '10px',
          fontFamily: 'monospace',
          backgroundColor: '#ffffff99',
          padding: '3px',
        }}>
          { data.join(' | ') }
        </span>
      </div>
    </div>
  );
});


